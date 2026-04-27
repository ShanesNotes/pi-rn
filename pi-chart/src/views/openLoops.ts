// openLoops(params) — intents without matching action fulfillments
// (DESIGN §4.6). Explicit `links.fulfills` semantics replace the
// brittle "match by subtype+time" heuristic.
//
// State machine (§4.6):
//   pending      — no fulfillments yet, no due_by or due_by > asOf
//   in_progress  — ≥1 fulfillment with status: active, no terminal
//   overdue      — no terminal fulfillment AND due_by < asOf
//   failed       — a fulfillment with a failure signal
//
// "Closed" intents (completed, cancelled, resolved → reflected via status
// final/superseded/entered_in_error) are omitted from output entirely.
//
// ADR 002 keeps graph lifecycle in envelope `status`; domain failure lives
// in `data.status_detail`. Legacy `data.outcome` remains a v0.2 back-compat
// fallback for old fixtures.

import {
  isCorrected,
  isSuperseded,
  isVisibleAsOf,
  loadContext,
} from "./active.js";
import { globPerDayFile, iterNdjson } from "../fs-util.js";
import { eventCoversAsOf, eventStartIso } from "../time.js";
import { patientRoot } from "../types.js";
import { vitalQualityState } from "../vitals.js";
import type { ActiveContext } from "./active.js";
import type {
  ContestedAxis,
  ContestedClaim,
  ContestedRuntimeEntry,
  EventEnvelope,
  OpenLoop,
  OpenLoopState,
  OpenLoopsParams,
  PatientScope,
  VitalOpenLoop,
} from "../types.js";

interface ContestedPair extends ContestedRuntimeEntry {
  older: EventEnvelope;
  newer: EventEnvelope;
}

type AnyOpenLoop = OpenLoop | ContestedClaim | VitalOpenLoop;

export async function openLoops(
  params: OpenLoopsParams,
): Promise<AnyOpenLoop[]> {
  const ctx = await loadContext(params.scope, params.asOf);
  const asOfMs = ctx.asOfMs;

  const fulfillmentsByIntent = indexFulfillments(ctx.events);

  const ordinary: OpenLoop[] = [];
  for (const intent of ctx.events) {
    if (intent.type !== "intent") continue;
    if (params.encounterId && intent.encounter_id !== params.encounterId) continue;
    // An intent authored after `asOf` is not yet visible; skip it so
    // callers can time-travel without seeing future loops.
    if (!isVisibleAsOf(intent, ctx)) continue;
    if (!eventCoversAsOf(intent, asOfMs)) continue;
    // Intents whose lifecycle has closed out via status never appear.
    if (
      intent.status === "final" ||
      intent.status === "superseded" ||
      intent.status === "entered_in_error"
    ) {
      continue;
    }
    if (isSuperseded(intent, ctx) || isCorrected(intent, ctx)) continue;
    const fulfillments = (fulfillmentsByIntent.get(intent.id) ?? []).filter(
      (f) =>
        isVisibleAsOf(f, ctx) &&
        !isSuperseded(f, ctx) &&
        !isCorrected(f, ctx),
    );
    if (hasClosingFulfillment(fulfillments)) continue;

    const dueBy = readDueBy(intent);
    const state = computeState(fulfillments, dueBy, asOfMs);
    const addressesProblems = resolveAddressesProblems(intent, ctx);

    ordinary.push({
      intent,
      state,
      fulfillments,
      addressesProblems,
      ...(dueBy !== null && Number.isFinite(asOfMs)
        ? { dueDeltaMinutes: Math.round((dueBy - asOfMs) / 60000) }
        : {}),
    });
  }

  ordinary.sort((a, b) =>
    (eventStartIso(a.intent) ?? "").localeCompare(eventStartIso(b.intent) ?? "") ||
    a.intent.id.localeCompare(b.intent.id),
  );

  const vital = await buildVitalLoops(params.scope, ctx, fulfillmentsByIntent, params.encounterId);
  const contested = buildContestedClaims(ctx, params.encounterId);
  const out: AnyOpenLoop[] = [...ordinary, ...vital, ...contested];
  out.sort((a, b) =>
    openLoopSortBucket(a) - openLoopSortBucket(b) ||
    (eventStartIso(a.intent) ?? "").localeCompare(eventStartIso(b.intent) ?? "") ||
    a.intent.id.localeCompare(b.intent.id),
  );
  return out;
}

interface LatestVital {
  metric: string;
  sampled_at: string;
  subject: string;
  encounter_id: string;
  value: unknown;
}

async function buildVitalLoops(
  scope: PatientScope,
  ctx: ActiveContext,
  fulfillmentsByIntent: Map<string, EventEnvelope[]>,
  encounterId: string | undefined,
): Promise<VitalOpenLoop[]> {
  const latest = await latestVitalsByMetric(scope, ctx.asOfMs);
  const out: VitalOpenLoop[] = [];
  for (const intent of ctx.events) {
    if (intent.type !== "intent" || intent.subtype !== "monitoring_plan") continue;
    if (encounterId && intent.encounter_id !== encounterId) continue;
    if (!isVisibleAsOf(intent, ctx)) continue;
    if (!eventCoversAsOf(intent, ctx.asOfMs)) continue;
    if (intent.status === "final" || intent.status === "superseded" || intent.status === "entered_in_error") continue;
    if (isSuperseded(intent, ctx) || isCorrected(intent, ctx)) continue;
    const fulfillments = (fulfillmentsByIntent.get(intent.id) ?? []).filter(
      (f) =>
        isVisibleAsOf(f, ctx) &&
        !isSuperseded(f, ctx) &&
        !isCorrected(f, ctx),
    );
    if (hasClosingFulfillment(fulfillments)) continue;
    const scopedLatest = latestVitalsForIntent(latest, intent);
    const cadence = parseDurationMinutes(intent.data?.required_cadence);
    const metrics = monitoringPlanMetrics(intent);
    if (cadence !== null) {
      const multiplier = numericOrDefault(intent.data?.staleness_multiplier, 1.5);
      for (const metric of metrics) {
        const last = scopedLatest.get(metric);
        const lastMs = last ? Date.parse(last.sampled_at) : NaN;
        const ageMinutes = Number.isFinite(lastMs)
          ? Math.floor((ctx.asOfMs - lastMs) / 60000)
          : undefined;
        const thresholdMinutes = cadence * multiplier;
        if (ageMinutes === undefined || ageMinutes > thresholdMinutes) {
          out.push({
            kind: isAlarmTriggeredPlan(intent) ? "vital_alarm" : "vital_cadence",
            intent,
            state: "overdue",
            fulfillments: [],
            addressesProblems: resolveAddressesProblems(intent, ctx),
            dueDeltaMinutes: ageMinutes === undefined ? undefined : Math.round(thresholdMinutes - ageMinutes),
            metric,
            lastSampledAt: last?.sampled_at,
            thresholdMinutes,
            ageMinutes,
            severity: isAlarmTriggeredPlan(intent) ? "high" : "medium",
            basis: isAlarmTriggeredPlan(intent)
              ? "alarm-triggered temporary monitoring obligation is overdue"
              : "ordered monitoring cadence is overdue",
          });
        }
      }
    }
    const alarm = activeAlertPolicy(intent, scopedLatest);
    if (alarm) {
      out.push({
        kind: "vital_alarm",
        intent,
        state: "pending",
        fulfillments: [],
        addressesProblems: resolveAddressesProblems(intent, ctx),
        metric: alarm.metric,
        lastSampledAt: alarm.sampled_at,
        thresholdMinutes: alarm.sustainedMinutes,
        ageMinutes: alarm.ageMinutes,
        severity: "high",
        basis: alarm.basis,
      });
    }
  }
  return out;
}

async function latestVitalsByMetric(
  scope: PatientScope,
  asOfMs: number,
): Promise<Map<string, LatestVital>> {
  const out = new Map<string, { t: number; point: LatestVital }>();
  for (const p of await globPerDayFile(patientRoot(scope), "vitals.jsonl")) {
    for await (const [, row] of iterNdjson(p)) {
      if (!row || typeof row.name !== "string") continue;
      if (vitalQualityState(row.quality) === "invalid") continue;
      const t = Date.parse(row.sampled_at ?? "");
      if (!Number.isFinite(t) || t > asOfMs) continue;
      if (typeof row.subject !== "string" || typeof row.encounter_id !== "string") continue;
      const key = vitalScopeKey(row.subject, row.encounter_id, row.name);
      const prior = out.get(key);
      if (!prior || t > prior.t) {
        out.set(key, {
          t,
          point: {
            metric: row.name,
            sampled_at: row.sampled_at,
            subject: row.subject,
            encounter_id: row.encounter_id,
            value: row.value,
          },
        });
      }
    }
  }
  return new Map([...out.entries()].map(([metric, entry]) => [metric, entry.point]));
}

function latestVitalsForIntent(
  latest: Map<string, LatestVital>,
  intent: EventEnvelope,
): Map<string, LatestVital> {
  const scoped = new Map<string, LatestVital>();
  for (const point of latest.values()) {
    if (point.subject === intent.subject && point.encounter_id === intent.encounter_id) {
      scoped.set(point.metric, point);
    }
  }
  return scoped;
}

function vitalScopeKey(subject: string, encounterId: string, metric: string): string {
  return `${subject}\u0000${encounterId}\u0000${metric}`;
}

function monitoringPlanMetrics(intent: EventEnvelope): string[] {
  const raw = intent.data?.metrics ?? intent.data?.metric ?? intent.data?.name;
  if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === "string");
  if (typeof raw === "string") return [raw];
  return [];
}

function isAlarmTriggeredPlan(intent: EventEnvelope): boolean {
  return intent.data?.triggered_by_alarm === true ||
    intent.data?.trigger === "alarm" ||
    intent.data?.temporary_trigger === "alarm";
}

function parseDurationMinutes(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw !== "string") return null;
  const text = raw.trim().toLowerCase();
  const simple = text.match(/^q?\s*(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes)$/);
  if (simple) return Number(simple[1]);
  const iso = text.match(/^pt(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?$/i);
  if (iso) return Number(iso[1] ?? 0) * 60 + Number(iso[2] ?? 0);
  return null;
}

function numericOrDefault(raw: unknown, fallback: number): number {
  return typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

function activeAlertPolicy(
  intent: EventEnvelope,
  latest: Map<string, LatestVital>,
): {
  metric: string;
  sampled_at: string;
  sustainedMinutes: number;
  ageMinutes?: number;
  basis: string;
} | null {
  const policy = intent.data?.alert_policy;
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) return null;
  const metric = typeof (policy as { metric?: unknown }).metric === "string"
    ? (policy as { metric: string }).metric
    : null;
  if (!metric) return null;
  const latestPoint = latest.get(metric);
  if (!latestPoint || typeof latestPoint.value !== "number") return null;
  const threshold = (policy as { threshold?: unknown }).threshold;
  if (typeof threshold !== "number") return null;
  const operator = (policy as { operator?: unknown }).operator;
  const breached =
    operator === "<" ? latestPoint.value < threshold :
    operator === "<=" ? latestPoint.value <= threshold :
    operator === ">" ? latestPoint.value > threshold :
    operator === ">=" ? latestPoint.value >= threshold :
    false;
  if (!breached) return null;
  const sustainedMinutes = numericOrDefault((policy as { sustained_minutes?: unknown }).sustained_minutes, 0);
  return {
    metric,
    sampled_at: latestPoint.sampled_at,
    sustainedMinutes,
    basis: `${metric} ${operator} ${threshold} alert policy is active`,
  };
}

function collectContestedPairs(ctx: ActiveContext): ContestedPair[] {
  const out: ContestedPair[] = [];
  const seen = new Set<string>();
  for (const newer of ctx.events) {
    if (!isContestedVisible(newer, ctx)) continue;
    for (const link of newer.links?.contradicts ?? []) {
      const older = ctx.byId.get(link.ref);
      if (!older || !isContestedVisible(older, ctx)) continue;
      const axis = classifyContestedAxis(older, newer);
      if (!axis) continue;
      const ordered = orderContestedPair(older, newer);
      const key = `${axis}:${ordered[0].id}:${ordered[1].id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        events: [ordered[0].id, ordered[1].id],
        basis: link.basis,
        axis,
        older: ordered[0],
        newer: ordered[1],
      });
    }
  }
  out.sort((a, b) =>
    a.axis.localeCompare(b.axis) ||
    a.events[0].localeCompare(b.events[0]) ||
    a.events[1].localeCompare(b.events[1]),
  );
  return out;
}

export function contestedRuntimeEntries(
  ctx: ActiveContext,
  encounterId?: string,
): ContestedRuntimeEntry[] {
  return collectContestedPairs(ctx)
    .filter((pair) =>
      !encounterId ||
      (pair.older.encounter_id === encounterId && pair.newer.encounter_id === encounterId),
    )
    .map(({ older: _older, newer: _newer, ...entry }) => entry);
}

function indexFulfillments(events: EventEnvelope[]): Map<string, EventEnvelope[]> {
  const out = new Map<string, EventEnvelope[]>();
  for (const ev of events) {
    if (ev.type !== "action") continue;
    for (const targetId of ev.links?.fulfills ?? []) {
      if (!out.has(targetId)) out.set(targetId, []);
      out.get(targetId)!.push(ev);
    }
  }
  return out;
}

function hasClosingFulfillment(fulfillments: EventEnvelope[]): boolean {
  return fulfillments.some((f) => f.status === "final" && !isFailureFulfillment(f));
}

function computeState(
  fulfillments: EventEnvelope[],
  dueBy: number | null,
  asOfMs: number,
): OpenLoopState {
  const failed = fulfillments.some(isFailureFulfillment);
  if (failed) return "failed";
  const hasActive = fulfillments.some((f) => f.status === "active");
  if (hasActive) return "in_progress";
  const overdue =
    dueBy !== null && Number.isFinite(asOfMs) && dueBy < asOfMs;
  if (overdue) return "overdue";
  return "pending";
}

function isFailureFulfillment(f: EventEnvelope): boolean {
  if (f.status === "entered_in_error") return true;
  const detail = f.data?.status_detail;
  if (typeof detail === "string" && /^(failed|failure|refused|aborted)$/i.test(detail)) {
    return true;
  }
  const outcome = f.data?.outcome;
  if (typeof outcome === "string" && /^(failed|failure|refused|aborted)$/i.test(outcome)) {
    return true;
  }
  return false;
}

function readDueBy(intent: EventEnvelope): number | null {
  const raw = intent.data?.due_by;
  if (typeof raw !== "string") return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
}

function resolveAddressesProblems(
  intent: EventEnvelope,
  ctx: ActiveContext,
): EventEnvelope[] {
  const out: EventEnvelope[] = [];
  for (const targetId of intent.links?.addresses ?? []) {
    const ref = ctx.byId.get(targetId);
    if (!ref) continue;
    if (ref.type === "assessment" && ref.subtype === "problem") out.push(ref);
  }
  return out;
}

function buildContestedClaims(ctx: ActiveContext, encounterId: string | undefined): ContestedClaim[] {
  const { thresholdSeconds, severity } = contestedClaimDefaults();
  const out: ContestedClaim[] = [];
  for (const pair of collectContestedPairs(ctx)) {
    if (
      encounterId &&
      (pair.older.encounter_id !== encounterId || pair.newer.encounter_id !== encounterId)
    ) {
      continue;
    }
    const newerMs = Date.parse(pair.newer.recorded_at);
    if (!Number.isFinite(newerMs) || !Number.isFinite(ctx.asOfMs)) continue;
    const ageSeconds = Math.max(0, Math.floor((ctx.asOfMs - newerMs) / 1000));
    if (ageSeconds < thresholdSeconds) continue;
    out.push({
      kind: "contested_claim",
      intent: pair.newer,
      state: "pending",
      fulfillments: [],
      addressesProblems: [],
      events: pair.events,
      basis: pair.basis,
      age_seconds: ageSeconds,
      threshold_seconds: thresholdSeconds,
      severity,
    });
  }
  return out;
}

function contestedClaimDefaults(): {
  thresholdSeconds: number;
  severity: "medium" | "high";
} {
  // TODO(ADR-008): accept profile overrides once profile lookup lands.
  return { thresholdSeconds: 3600, severity: "medium" };
}

function isContestedVisible(ev: EventEnvelope, ctx: ActiveContext): boolean {
  if (!isVisibleAsOf(ev, ctx)) return false;
  if (!eventCoversAsOf(ev, ctx.asOfMs)) return false;
  if (isSuperseded(ev, ctx) || isCorrected(ev, ctx)) return false;
  return true;
}

function classifyContestedAxis(
  older: EventEnvelope,
  newer: EventEnvelope,
): ContestedAxis | null {
  const olderIsConstraint =
    older.type === "constraint_set" ||
    (older.type === "assessment" && older.subtype === "constraint");
  const newerIsConstraint =
    newer.type === "constraint_set" ||
    (newer.type === "assessment" && newer.subtype === "constraint");
  if (olderIsConstraint && newerIsConstraint) {
    return "constraints";
  }
  if (
    older.type === "assessment" &&
    newer.type === "assessment" &&
    older.subtype === "problem" &&
    newer.subtype === "problem"
  ) {
    return "problems";
  }
  if (older.type === "intent" && newer.type === "intent") {
    return "intents";
  }
  if (older.type === "observation" && newer.type === "observation") {
    return "observations";
  }
  return null;
}

function orderContestedPair(
  older: EventEnvelope,
  newer: EventEnvelope,
): [EventEnvelope, EventEnvelope] {
  const olderMs = Date.parse(older.recorded_at);
  const newerMs = Date.parse(newer.recorded_at);
  if (Number.isFinite(olderMs) && Number.isFinite(newerMs) && olderMs > newerMs) {
    return [newer, older];
  }
  if (
    Number.isFinite(olderMs) &&
    Number.isFinite(newerMs) &&
    olderMs === newerMs &&
    older.id.localeCompare(newer.id) > 0
  ) {
    return [newer, older];
  }
  return [older, newer];
}

function openLoopSortBucket(loop: AnyOpenLoop): number {
  if ("kind" in loop && loop.kind === "contested_claim") {
    return loop.severity === "high" ? 0 : 2;
  }
  return loop.state === "overdue" ? 1 : 3;
}
