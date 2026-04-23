#!/usr/bin/env tsx
// Migrate one patient's v0.2 chart content to the ADR 015 v0.3 partial shape.
//
// The migration is deterministic and safe to re-run:
// - rewrites happen in a staging directory
// - staged output is validated before any live-path swap
// - success swaps only the touched live files
// - bare-string supports remain unchanged by design (ADR 015)

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { atomicWriteFile, ensureDir, globPerDayFile } from "../src/fs-util.js";
import { parseEvidenceRef } from "../src/evidence.js";
import { validateChart } from "../src/index.js";
import { eventCoversAsOf, eventStartMs } from "../src/time.js";

interface MigrationArgs {
  chartRoot: string;
  patientId: string;
}

export interface MigrationValidationReport {
  errors: number;
  warnings: number;
  warningMessages: string[];
  errorMessages: string[];
}

export interface MigrationResult {
  chartRoot: string;
  patientId: string;
  touchedFiles: string[];
  addressesToResolves: number;
  validation: MigrationValidationReport;
  alreadyMigrated: boolean;
}

interface MutableLinks {
  supports?: unknown[];
  addresses?: unknown[];
  resolves?: unknown[];
  [key: string]: unknown;
}

interface EventFileData {
  relativePath: string;
  absolutePath: string;
  events: any[];
}

interface RewriteStats {
  addressesToResolves: number;
}

const SCHEMA_VERSION = "0.3.0-partial";

function parseArgs(argv: string[]): MigrationArgs {
  let chartRoot = ".";
  let patientId: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--patient") {
      patientId = argv[++i];
      continue;
    }
    if (arg.startsWith("--patient=")) {
      patientId = arg.slice("--patient=".length);
      continue;
    }
    if (!arg.startsWith("-")) {
      if (chartRoot === ".") {
        chartRoot = arg;
      } else if (!patientId) {
        patientId = arg;
      }
    }
  }

  if (!patientId) {
    throw new Error(
      "usage: tsx scripts/migrate-v02-to-v03.ts <chartRoot> <patientId>  (or --patient <id>)",
    );
  }

  return {
    chartRoot: path.resolve(chartRoot),
    patientId,
  };
}

function dumpYaml(data: unknown): string {
  return yaml.dump(data, { sortKeys: false, lineWidth: 0 }).trimEnd() + "\n";
}

function stableSelection(selection: Record<string, unknown> | undefined) {
  if (!selection) return undefined;

  const out: Record<string, unknown> = {};
  for (const key of ["metric", "from", "to", "encounterId"]) {
    if (key in selection) out[key] = selection[key];
  }
  for (const key of Object.keys(selection).sort()) {
    if (key in out) continue;
    out[key] = selection[key];
  }
  return out;
}

function stableEvidenceRef(raw: unknown): unknown {
  if (typeof raw === "string") return raw;
  const parsed = parseEvidenceRef(raw);
  if (!parsed) return raw;

  const out: Record<string, unknown> = {
    ref: parsed.ref,
    kind: parsed.kind,
  };
  if (parsed.role) out.role = parsed.role;
  if (parsed.basis) out.basis = parsed.basis;
  const selection = stableSelection(
    parsed.selection && typeof parsed.selection === "object" && !Array.isArray(parsed.selection)
      ? (parsed.selection as Record<string, unknown>)
      : undefined,
  );
  if (selection) out.selection = selection;
  if (parsed.derived_from?.length) {
    out.derived_from = parsed.derived_from.map((item) => stableEvidenceRef(item));
  }
  return out;
}

function normalizeEvidenceRefArray(items: unknown[] | undefined): unknown[] | undefined {
  if (!Array.isArray(items)) return items;
  return items.map((item) => (typeof item === "string" ? item : stableEvidenceRef(item)));
}

function fulfillsTarget(ev: any, targetId: unknown): boolean {
  if (typeof targetId !== "string") return false;
  const fulfills = Array.isArray(ev?.links?.fulfills) ? ev.links.fulfills : [];
  return fulfills.includes(targetId);
}

function isFailureFulfillment(ev: any): boolean {
  if (ev?.status === "entered_in_error") return true;
  const outcome = ev?.data?.outcome;
  return typeof outcome === "string" && /^(failed|failure|refused|aborted)$/i.test(outcome);
}

function isVisibleAtAnchor(ev: any, anchorMs: number): boolean {
  if (!Number.isFinite(anchorMs)) return false;
  const recordedAt = Date.parse(String(ev?.recorded_at ?? ""));
  if (!Number.isFinite(recordedAt) || recordedAt > anchorMs) return false;
  const start = eventStartMs(ev);
  if (start === null || start > anchorMs) return false;
  return eventCoversAsOf(ev, anchorMs);
}

function isReplacedAtAnchor(
  targetId: string,
  events: any[],
  anchorMs: number,
): boolean {
  for (const ev of events) {
    if (!isVisibleAtAnchor(ev, anchorMs)) continue;
    const supersedes = Array.isArray(ev?.links?.supersedes) ? ev.links.supersedes : [];
    if (supersedes.includes(targetId)) return true;
    const corrects = Array.isArray(ev?.links?.corrects) ? ev.links.corrects : [];
    if (corrects.includes(targetId)) return true;
  }
  return false;
}

function isResolvableIntent(target: any, events: any[], anchorMs: number): boolean {
  if (target?.type !== "intent") return false;
  if (!isVisibleAtAnchor(target, anchorMs)) return false;
  if (isReplacedAtAnchor(String(target.id ?? ""), events, anchorMs)) return false;
  if (
    target.status === "final" ||
    target.status === "superseded" ||
    target.status === "entered_in_error"
  ) {
    return false;
  }

  const fulfillments = events
    .filter((candidate) => fulfillsTarget(candidate, target.id))
    .filter((candidate) => isVisibleAtAnchor(candidate, anchorMs))
    .filter((candidate) => !isReplacedAtAnchor(String(candidate.id ?? ""), events, anchorMs));

  if (fulfillments.some((candidate) => candidate.status === "final")) return false;
  if (fulfillments.some(isFailureFulfillment)) return false;
  if (fulfillments.some((candidate) => candidate.status === "active")) return false;
  return true;
}

function isUnacknowledgedCommunication(target: any, events: any[], anchorMs: number): boolean {
  return target?.type === "communication" &&
    target?.data?.status_detail === "sent" &&
    !isReplacedAtAnchor(String(target.id ?? ""), events, anchorMs);
}

function isActiveAlertPlaceholder(target: any): boolean {
  return target?.type === "observation" &&
    target?.subtype === "alert" &&
    target?.status === "active" &&
    target?.data?.status_detail === undefined;
}

function isOpenLoopKindAtSource(target: any, allEvents: any[], sourceRecordedAt: string): boolean {
  const anchorMs = Date.parse(String(sourceRecordedAt ?? ""));
  if (!Number.isFinite(anchorMs)) return false;
  if (isResolvableIntent(target, allEvents, anchorMs)) return true;
  if (isUnacknowledgedCommunication(target, allEvents, anchorMs)) return true;
  if (isActiveAlertPlaceholder(target) && isVisibleAtAnchor(target, anchorMs)) return true;
  return false;
}

function rewriteAddressesToResolves(
  links: MutableLinks,
  ev: any,
  eventsById: Map<string, any>,
  allEvents: any[],
  stats: RewriteStats,
) {
  if (!Array.isArray(links.addresses) || links.addresses.length === 0) return;

  const keptAddresses: unknown[] = [];
  const rewrittenResolves: string[] = Array.isArray(links.resolves)
    ? links.resolves.filter((item): item is string => typeof item === "string")
    : [];

  for (const targetId of links.addresses) {
    if (typeof targetId !== "string") {
      keptAddresses.push(targetId);
      continue;
    }
    const target = eventsById.get(targetId);
    if (target && isOpenLoopKindAtSource(target, allEvents, String(ev?.recorded_at ?? ""))) {
      if (!rewrittenResolves.includes(targetId)) rewrittenResolves.push(targetId);
      stats.addressesToResolves += 1;
      continue;
    }
    keptAddresses.push(targetId);
  }

  if (keptAddresses.length > 0) {
    links.addresses = keptAddresses;
  } else {
    delete links.addresses;
  }
  if (rewrittenResolves.length > 0) {
    links.resolves = rewrittenResolves;
  } else if (Array.isArray(links.resolves) && links.resolves.length === 0) {
    delete links.resolves;
  }
}

function rewriteEvent(
  ev: any,
  eventsById: Map<string, any>,
  allEvents: any[],
  stats: RewriteStats,
) {
  if (ev?.links && typeof ev.links === "object" && !Array.isArray(ev.links)) {
    const links = ev.links as MutableLinks;
    links.supports = normalizeEvidenceRefArray(links.supports);
    rewriteAddressesToResolves(links, ev, eventsById, allEvents, stats);
  }

  if (ev?.transform && typeof ev.transform === "object" && !Array.isArray(ev.transform)) {
    if (Array.isArray(ev.transform.input_refs)) {
      ev.transform.input_refs = normalizeEvidenceRefArray(ev.transform.input_refs);
    }
  }
}

async function readJsonLines(filePath: string): Promise<any[]> {
  const text = await fs.readFile(filePath, "utf8");
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function encodeJsonLines(events: any[]): string {
  return events.map((event) => JSON.stringify(event)).join("\n") + "\n";
}

async function loadEventFiles(patientRoot: string): Promise<EventFileData[]> {
  const files = await globPerDayFile(patientRoot, "events.ndjson");
  const out: EventFileData[] = [];
  for (const absolutePath of files.sort()) {
    out.push({
      relativePath: path.relative(patientRoot, absolutePath),
      absolutePath,
      events: await readJsonLines(absolutePath),
    });
  }
  return out;
}

async function copySubsetToStage(
  chartRoot: string,
  patientId: string,
  stageRoot: string,
): Promise<void> {
  await ensureDir(stageRoot);
  await fs.cp(path.join(chartRoot, "schemas"), path.join(stageRoot, "schemas"), {
    recursive: true,
  });
  await ensureDir(path.join(stageRoot, "patients"));
  await fs.cp(
    path.join(chartRoot, "patients", patientId),
    path.join(stageRoot, "patients", patientId),
    { recursive: true },
  );
  await fs.copyFile(
    path.join(chartRoot, "pi-chart.yaml"),
    path.join(stageRoot, "pi-chart.yaml"),
  );
}

async function rewriteSchemaVersion(filePath: string): Promise<void> {
  const text = await fs.readFile(filePath, "utf8");
  const data = yaml.load(text);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`invalid YAML mapping: ${filePath}`);
  }
  const updated = { ...(data as Record<string, unknown>), schema_version: SCHEMA_VERSION };
  await fs.writeFile(filePath, dumpYaml(updated));
}

async function rewriteStagedPatient(
  stageRoot: string,
  patientId: string,
): Promise<RewriteStats> {
  const patientRoot = path.join(stageRoot, "patients", patientId);
  const eventFiles = await loadEventFiles(patientRoot);
  const allEvents = eventFiles.flatMap((file) => file.events);
  const eventsById = new Map(
    allEvents
      .filter((ev) => typeof ev?.id === "string")
      .map((ev) => [ev.id as string, ev]),
  );

  const stats: RewriteStats = { addressesToResolves: 0 };
  for (const file of eventFiles) {
    for (const ev of file.events) rewriteEvent(ev, eventsById, allEvents, stats);
    await fs.writeFile(file.absolutePath, encodeJsonLines(file.events));
  }

  await rewriteSchemaVersion(path.join(stageRoot, "pi-chart.yaml"));
  await rewriteSchemaVersion(path.join(patientRoot, "chart.yaml"));
  return stats;
}

function formatValidationReport(report: Awaited<ReturnType<typeof validateChart>>): MigrationValidationReport {
  return {
    errors: report.errors.length,
    warnings: report.warnings.length,
    warningMessages: report.warnings.map((item) => `${item.where}: ${item.message}`),
    errorMessages: report.errors.map((item) => `${item.where}: ${item.message}`),
  };
}

async function collectTouchedFiles(stageRoot: string, patientId: string): Promise<string[]> {
  const out = ["pi-chart.yaml", path.join("patients", patientId, "chart.yaml")];
  const patientRoot = path.join(stageRoot, "patients", patientId);
  const eventFiles = await globPerDayFile(patientRoot, "events.ndjson");
  for (const absolutePath of eventFiles.sort()) {
    out.push(path.join("patients", patientId, path.relative(patientRoot, absolutePath)));
  }
  return out;
}

async function readTouchedFileMap(
  root: string,
  touchedFiles: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const relativePath of touchedFiles) {
    out.set(relativePath, await fs.readFile(path.join(root, relativePath), "utf8"));
  }
  return out;
}

async function syncTouchedFilesFromStage(
  liveChartRoot: string,
  stageRoot: string,
  touchedFiles: string[],
): Promise<void> {
  for (const relativePath of touchedFiles) {
    const stagedPath = path.join(stageRoot, relativePath);
    const livePath = path.join(liveChartRoot, relativePath);
    await ensureDir(path.dirname(livePath));
    await atomicWriteFile(livePath, await fs.readFile(stagedPath));
  }
}

async function createStageRoot(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-v03-stage-"));
}

async function removeStageRoot(stageRoot: string): Promise<void> {
  await fs.rm(stageRoot, { recursive: true, force: true });
}

function printValidation(report: MigrationValidationReport): void {
  for (const warning of report.warningMessages) console.log(`WARN   ${warning}`);
  for (const error of report.errorMessages) console.log(`ERROR  ${error}`);
}

export async function migrateV02ToV03(
  chartRoot: string,
  patientId: string,
): Promise<MigrationResult> {
  chartRoot = path.resolve(chartRoot);
  const patientRoot = path.join(chartRoot, "patients", patientId);
  await fs.access(path.join(chartRoot, "pi-chart.yaml"));
  await fs.access(path.join(patientRoot, "chart.yaml"));

  const stageRoot = await createStageRoot();
  try {
    await copySubsetToStage(chartRoot, patientId, stageRoot);
    const stats = await rewriteStagedPatient(stageRoot, patientId);
    const touchedFiles = await collectTouchedFiles(stageRoot, patientId);
    const validation = formatValidationReport(
      await validateChart({ chartRoot: stageRoot, patientId }),
    );

    if (validation.errors > 0) {
      printValidation(validation);
      throw new Error(
        `migration validation failed for ${patientId}: ${validation.errors} error(s), ${validation.warnings} warning(s)`,
      );
    }

    const beforeByFile = await readTouchedFileMap(chartRoot, touchedFiles);
    const afterByFile = await readTouchedFileMap(stageRoot, touchedFiles);

    const changedFiles = touchedFiles.filter(
      (relativePath) => beforeByFile.get(relativePath) !== afterByFile.get(relativePath),
    );
    if (changedFiles.length > 0) {
      await syncTouchedFilesFromStage(chartRoot, stageRoot, changedFiles);
    }

    return {
      chartRoot,
      patientId,
      touchedFiles: changedFiles,
      addressesToResolves: stats.addressesToResolves,
      validation,
      alreadyMigrated: changedFiles.length === 0,
    };
  } finally {
    await removeStageRoot(stageRoot);
  }
}

async function main() {
  const { chartRoot, patientId } = parseArgs(process.argv.slice(2));
  const result = await migrateV02ToV03(chartRoot, patientId);
  console.log(
    `migrated ${patientId} in ${result.chartRoot}: ${result.touchedFiles.length} file(s) updated, ${result.addressesToResolves} addresses→resolves rewrite(s), ${result.validation.errors} error(s), ${result.validation.warnings} warning(s)`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
