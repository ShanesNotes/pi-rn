import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { shim, waitForShim, type RawVitals } from "./client.js";
import { loadPulseScenario } from "./runtime/pulseScenario.js";
import type { NumericField, Scenario } from "./types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

type Mode = "regression" | "reference";
type Tolerance = { pct?: number; abs?: number };

type ReferenceCurve = {
  scenario: string;
  reference_source?: {
    engine?: string;
    version?: string;
    scenario_file?: string;
    validation_page?: string;
    extraction_date?: string;
  };
  tolerance?: { default_pct?: number; by_vital?: Partial<Record<NumericField, Tolerance>> };
  checkpoints: { t: number; phase?: string; expect: Partial<Record<NumericField, number>> }[];
};

type Result = {
  t: number;
  phase?: string;
  vital: string;
  observed: number;
  expected: [number, number] | number;
  passed: boolean;
  delta_abs?: number;
  delta_pct?: number;
  tolerance?: Tolerance;
};

type Report = {
  scenario: string;
  mode: Mode;
  status: "pass" | "fail" | "skip";
  results: Result[];
  summary: { passed: number; failed: number; skipped: number };
  observation_path?: string;
  reference_path?: string;
  note?: string;
};

const RED = "\x1b[31m";
const GRN = "\x1b[32m";
const YEL = "\x1b[33m";
const DIM = "\x1b[2m";
const B = "\x1b[1m";
const R = "\x1b[0m";

const ADVANCE_STEP_S = 10;

async function advanceTo(targetT: number, currentT: number): Promise<RawVitals> {
  let t = currentT;
  let last: RawVitals | undefined;
  while (t < targetT - 0.001) {
    const dt = Math.min(ADVANCE_STEP_S, targetT - t);
    last = await shim.advance(dt);
    t = last.t;
  }
  return last ?? (await shim.vitals());
}

function withinTolerance(observed: number, expected: number, tol: Tolerance): { passed: boolean; delta_abs: number; delta_pct: number } {
  const delta_abs = Math.abs(observed - expected);
  const delta_pct = expected === 0 ? Infinity : (delta_abs / Math.abs(expected)) * 100;
  if (typeof tol.abs === "number") return { passed: delta_abs <= tol.abs, delta_abs, delta_pct };
  const pct = tol.pct ?? 15;
  return { passed: delta_pct <= pct, delta_abs, delta_pct };
}

async function runScenario(path: string, mode: Mode, refPathOverride: string | undefined, observe: boolean): Promise<Report> {
  const scenario: Scenario = loadPulseScenario(path);
  const scenarioName = basename(path, ".json");

  let referenceCurve: ReferenceCurve | undefined;
  let refPath: string | undefined;
  if (mode === "reference") {
    refPath = refPathOverride ?? join(ROOT, "resources", "physiology", "validation-curves", basename(path));
    if (!existsSync(refPath)) {
      return {
        scenario: scenarioName, mode, status: "skip",
        results: [], summary: { passed: 0, failed: 0, skipped: 0 },
        reference_path: refPath, note: "no reference curve file",
      };
    }
    referenceCurve = JSON.parse(readFileSync(refPath, "utf8")) as ReferenceCurve;
    if ((referenceCurve.checkpoints ?? []).length === 0) {
      return {
        scenario: scenarioName, mode, status: "skip",
        results: [], summary: { passed: 0, failed: 0, skipped: 0 },
        reference_path: refPath, note: "no reference checkpoints populated",
      };
    }
  }

  await shim.init(scenario.state_file);

  const timeline = [...scenario.timeline].sort((a, b) => a.t - b.t);
  let actionIdx = 0;

  const evalTimes = mode === "regression"
    ? (scenario.checkpoints ?? []).map((c) => c.t)
    : (referenceCurve!.checkpoints ?? []).map((c) => c.t);
  const sortedEvalTimes = [...evalTimes].sort((a, b) => a - b);

  const results: Result[] = [];
  const observations: Array<Record<string, unknown>> = [];
  let currentT = 0;

  for (const targetT of sortedEvalTimes) {
    while (actionIdx < timeline.length && timeline[actionIdx].t <= targetT) {
      const entry = timeline[actionIdx++];
      if (entry.t > currentT) {
        const v = await advanceTo(entry.t, currentT);
        currentT = v.t;
      }
      await shim.action(entry.action.type, entry.action.params);
    }

    const frame = await advanceTo(targetT, currentT);
    currentT = frame.t;

    if (mode === "regression") {
      const cp = (scenario.checkpoints ?? []).find((c) => c.t === targetT)!;
      if (observe) observations.push({ ...frame, phase: cp.phase });
      for (const [vital, range] of Object.entries(cp.expect) as [string, [number, number]][]) {
        const observed = (frame as Record<string, unknown>)[vital];
        if (typeof observed !== "number" || !Number.isFinite(observed)) continue;
        const [lo, hi] = range;
        results.push({
          t: cp.t, phase: cp.phase, vital, observed,
          expected: range, passed: observed >= lo && observed <= hi,
        });
      }
    } else {
      const rc = referenceCurve!;
      const cp = rc.checkpoints.find((c) => c.t === targetT)!;
      if (observe) observations.push({ ...frame, phase: cp.phase });
      for (const [vital, expected] of Object.entries(cp.expect) as [string, number][]) {
        const observed = (frame as Record<string, unknown>)[vital];
        if (typeof observed !== "number" || !Number.isFinite(observed)) continue;
        const tol: Tolerance =
          rc.tolerance?.by_vital?.[vital as NumericField] ??
          { pct: rc.tolerance?.default_pct ?? 15 };
        const { passed, delta_abs, delta_pct } = withinTolerance(observed, expected, tol);
        results.push({ t: cp.t, phase: cp.phase, vital, observed, expected, passed, delta_abs, delta_pct, tolerance: tol });
      }
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const report: Report = {
    scenario: scenarioName, mode,
    status: failed === 0 ? "pass" : "fail",
    results, summary: { passed, failed, skipped: 0 },
    reference_path: refPath,
  };

  if (observe) {
    const outDir = join(ROOT, ".omx", "observations");
    mkdirSync(outDir, { recursive: true });
    const artifactPath = join(outDir, `${scenarioName}-${mode}.json`);
    writeFileSync(artifactPath, JSON.stringify({
      scenario: scenarioName, mode, reference_path: refPath,
      reference_source: referenceCurve?.reference_source,
      observations,
    }, null, 2) + "\n");
    report.observation_path = artifactPath;
  }

  return report;
}

function formatReport(r: Report, path: string): string {
  const badge = r.status === "pass" ? `${GRN}PASS${R}` : r.status === "fail" ? `${RED}FAIL${R}` : `${YEL}SKIP${R}`;
  const artifact = r.observation_path ? `, artifact=${basename(r.observation_path)}` : "";
  const head = `${B}${path}${R}  ${badge}  ${DIM}(mode=${r.mode}, ${r.results.length} comparisons${artifact})${R}`;
  if (r.status === "skip") return `${head}\n  ${DIM}${r.note ?? ""}${R}`;
  if (r.status === "pass") return head;
  const rows = r.results.filter((x) => !x.passed).map((x) => {
    const exp = Array.isArray(x.expected) ? `[${x.expected[0]}, ${x.expected[1]}]` : `${x.expected}`;
    const delta = x.delta_pct !== undefined && Number.isFinite(x.delta_pct) ? `  Δ${x.delta_pct.toFixed(1)}%` : "";
    return `  ${RED}t=${String(x.t).padStart(4)}s${R}  ${x.vital.padEnd(18)}  observed ${x.observed.toFixed(1)}  expected ${exp}${delta}`;
  });
  return [head, ...rows].join("\n");
}

function parseArgs() {
  const argv = process.argv.slice(2);
  let mode: Mode = "regression";
  let observe = false;
  let json = false;
  let reference: string | undefined;
  const scenarios: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--mode") {
      const m = argv[++i];
      if (m !== "regression" && m !== "reference") throw new Error(`unknown --mode '${m}'`);
      mode = m;
    } else if (a === "--observe") observe = true;
    else if (a === "--json") json = true;
    else if (a === "--reference") reference = argv[++i];
    else if (a === "--scenario") scenarios.push(resolve(argv[++i]));
    else if (a.startsWith("--")) throw new Error(`unknown flag '${a}'`);
    else scenarios.push(resolve(a));
  }
  if (scenarios.length === 0) {
    scenarios.push(
      resolve("vitals/scenarios/hemorrhagic_shock.json"),
      resolve("vitals/scenarios/sepsis_norepi.json"),
    );
  }
  return { mode, observe, json, reference, scenarios };
}

async function main() {
  const args = parseArgs();
  await waitForShim();
  const reports: Report[] = [];
  for (const s of args.scenarios) {
    const r = await runScenario(s, args.mode, args.reference, args.observe);
    reports.push(r);
    if (!args.json) console.log(formatReport(r, s));
  }
  if (args.json) process.stdout.write(JSON.stringify(reports.length === 1 ? reports[0] : reports, null, 2) + "\n");
  const anyFail = reports.some((r) => r.status === "fail");
  process.exit(anyFail ? 1 : 0);
}

main().catch((e) => {
  console.error("[validate] error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
