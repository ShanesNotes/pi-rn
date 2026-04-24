// currentState(params) — axis-specific active semantics (DESIGN §4.3).
//
// Axis lifecycle table:
//   constraints   status ∈ {active, final} AND not superseded/corrected
//   problems      status ∈ {active} AND subtype='problem' AND not superseded/corrected
//                 (a "problem" in pi-chart is an assessment with subtype='problem';
//                  §4.3 also accepts `unresolved` but our Status enum doesn't have
//                  that value, so we treat any `active` problem-assessment as live)
//   intents       delegated to openLoops (§4.6) — the intent axis IS open loops
//   vitals        latest valid sample per metric (no supersession — vitals don't
//                 supersede; later samples are just newer)
//
// `asOf` defaults to the chart's latest event start (sim-time semantics).

import { iterNdjson, globPerDayFile } from "../fs-util.js";
import {
  eventCoversAsOf,
  eventStartIso,
} from "../time.js";
import { patientRoot } from "../types.js";
import {
  isCorrected,
  isSuperseded,
  loadContext,
  resolveAsOfMs,
} from "./active.js";
import type {
  ContestedRuntimeEntry,
  CurrentState,
  CurrentStateParams,
  EventEnvelope,
  PatientScope,
  TrendPoint,
} from "../types.js";
import {
  contestedRuntimeEntries,
  openLoops,
} from "./openLoops.js";
import { formatSource } from "./source.js";

type ActiveContextReady = Awaited<ReturnType<typeof loadContext>>;

export async function currentState(params: CurrentStateParams): Promise<CurrentState> {
  // Resolve asOf once — default "now" is chart-clock now (sim or wall)
  // per DESIGN §4.3. All axis branches share the same asOf to keep the
  // composite "all" view internally consistent.
  const asOfMs = await resolveAsOfMs(params.scope, params.asOf);
  const asOf = new Date(asOfMs).toISOString();
  const ctx = await loadContext(params.scope, asOf);
  const contested = contestedRuntimeEntries(ctx);
  const contestedByAxis = {
    constraints: selectContested(contested, "constraints"),
    problems: selectContested(contested, "problems"),
    intents: selectContested(contested, "intents"),
    observations: selectContested(contested, "observations"),
  };

  switch (params.axis) {
    case "constraints":
      return {
        axis: "constraints",
        items: collectConstraints(ctx),
        contested: contestedByAxis.constraints,
      };
    case "problems":
      return {
        axis: "problems",
        items: collectProblems(ctx),
        contested: contestedByAxis.problems,
      };
    case "intents": {
      const loops = await openLoops({ scope: params.scope, asOf });
      return {
        axis: "intents",
        items: loops.filter(
          (loop): loop is Exclude<typeof loop, { kind: "contested_claim" }> =>
            !("kind" in loop) || loop.kind !== "contested_claim",
        ),
        contested: contestedByAxis.intents,
      };
    }
    case "vitals":
      return {
        axis: "vitals",
        items: await collectLatestVitals(params, asOf),
      };
    case "all": {
      const constraints = collectConstraints(ctx);
      const problems = collectProblems(ctx);
      const intents = await openLoops({
        scope: params.scope,
        asOf,
      });
      const vitals = await collectLatestVitals(params, asOf);
      const observations = collectObservations(ctx);
      return {
        axis: "all",
        constraints,
        problems,
        intents: intents.filter(
          (loop): loop is Exclude<typeof loop, { kind: "contested_claim" }> =>
            !("kind" in loop) || loop.kind !== "contested_claim",
        ),
        vitals,
        observations,
        contested: {
          constraints: contestedByAxis.constraints,
          problems: contestedByAxis.problems,
          intents: contestedByAxis.intents,
          observations: contestedByAxis.observations,
        },
      };
    }
  }
}

export async function activeProblems(
  scope: PatientScope,
  asOf?: string,
): Promise<EventEnvelope[]> {
  const state = await currentState({ scope, axis: "problems", asOf });
  return state.axis === "problems" ? state.items : [];
}

function collectConstraints(ctx: ActiveContextReady): EventEnvelope[] {
  const canonical: EventEnvelope[] = [];
  const legacyStructural: EventEnvelope[] = [];
  for (const ev of ctx.events) {
    const isCanonicalConstraint =
      ev.type === "assessment" && ev.subtype === "constraint";
    const isLegacyStructuralConstraint = ev.type === "constraint_set";
    if (!isCanonicalConstraint && !isLegacyStructuralConstraint) continue;
    if (!(ev.status === "active" || ev.status === "final")) continue;
    if (isSuperseded(ev, ctx) || isCorrected(ev, ctx)) continue;
    if (!eventCoversAsOf(ev, ctx.asOfMs)) continue;
    if (isCanonicalConstraint) {
      canonical.push(ev);
    } else {
      legacyStructural.push(ev);
    }
  }
  const out = canonical.length > 0 ? canonical : legacyStructural;
  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

function collectProblems(ctx: ActiveContextReady): EventEnvelope[] {
  const out: EventEnvelope[] = [];
  for (const ev of ctx.events) {
    if (ev.type !== "assessment") continue;
    if (ev.subtype !== "problem") continue;
    if (ev.status !== "active") continue;
    if (isSuperseded(ev, ctx) || isCorrected(ev, ctx)) continue;
    if (!eventCoversAsOf(ev, ctx.asOfMs)) continue;
    out.push(ev);
  }
  out.sort((a, b) =>
    (eventStartIso(a) ?? "").localeCompare(eventStartIso(b) ?? "") ||
    a.id.localeCompare(b.id),
  );
  return out;
}

function collectObservations(
  ctx: ActiveContextReady,
): EventEnvelope[] {
  const out: EventEnvelope[] = [];
  for (const ev of ctx.events) {
    if (ev.type !== "observation") continue;
    if (isSuperseded(ev, ctx) || isCorrected(ev, ctx)) continue;
    if (!eventCoversAsOf(ev, ctx.asOfMs)) continue;
    out.push(ev);
  }
  out.sort((a, b) =>
    (eventStartIso(a) ?? "").localeCompare(eventStartIso(b) ?? "") ||
    a.id.localeCompare(b.id),
  );
  return out;
}

function selectContested(
  entries: ContestedRuntimeEntry[],
  axis: ContestedRuntimeEntry["axis"],
): ContestedRuntimeEntry[] {
  return entries.filter((entry) => entry.axis === axis);
}

/** Latest sample per metric as of `asOf`. No supersession — vitals aren't claims. */
async function collectLatestVitals(
  params: CurrentStateParams,
  asOf: string,
): Promise<Record<string, TrendPoint>> {
  const pr = patientRoot(params.scope);
  const asOfMs = Date.parse(asOf);
  const latest: Record<string, { t: number; point: TrendPoint }> = {};
  for (const p of await globPerDayFile(pr, "vitals.jsonl")) {
    for await (const [, v] of iterNdjson(p)) {
      if (!v || typeof v.name !== "string") continue;
      if (v.quality === "invalid") continue;
      const t = Date.parse(v.sampled_at ?? "");
      if (!Number.isFinite(t) || t > asOfMs) continue;
      const source = formatSource(v.source);
      const point: TrendPoint = {
        sampled_at: v.sampled_at,
        value: v.value,
        unit: v.unit,
        source,
        context: v.context,
      };
      const prior = latest[v.name];
      if (!prior || t > prior.t) latest[v.name] = { t, point };
    }
  }
  const out: Record<string, TrendPoint> = {};
  for (const [name, entry] of Object.entries(latest)) out[name] = entry.point;
  return out;
}
