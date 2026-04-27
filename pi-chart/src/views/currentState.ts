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
import {
  A1_CANONICAL_SHARED_METRICS,
  isProfileRoutedTrainingMetric,
  vitalQualityState,
} from "../vitals.js";

type ActiveContextReady = Awaited<ReturnType<typeof loadContext>>;

export async function currentState(params: CurrentStateParams): Promise<CurrentState> {
  // Resolve asOf once — default "now" is chart-clock now (sim or wall)
  // per DESIGN §4.3. All axis branches share the same asOf to keep the
  // composite "all" view internally consistent.
  const asOfMs = await resolveAsOfMs(params.scope, params.asOf);
  const asOf = new Date(asOfMs).toISOString();
  const ctx = await loadContext(params.scope, asOf);
  const contested = contestedRuntimeEntries(ctx, params.encounterId);
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
        items: collectConstraints(ctx, params.encounterId),
        contested: contestedByAxis.constraints,
      };
    case "problems":
      return {
        axis: "problems",
        items: collectProblems(ctx, params.encounterId),
        contested: contestedByAxis.problems,
      };
    case "intents": {
      const loops = await openLoops({ scope: params.scope, asOf, encounterId: params.encounterId });
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
    case "context":
      return {
        axis: "context",
        items: collectActiveContextSegments(ctx, params.encounterId),
      };
    case "all": {
      const constraints = collectConstraints(ctx, params.encounterId);
      const problems = collectProblems(ctx, params.encounterId);
      const intents = await openLoops({
        scope: params.scope,
        asOf,
        encounterId: params.encounterId,
      });
      const vitals = await collectLatestVitals(params, asOf);
      const context = collectActiveContextSegments(ctx, params.encounterId);
      const observations = collectObservations(ctx, params.encounterId);
      return {
        axis: "all",
        constraints,
        problems,
        intents: intents.filter(
          (loop): loop is Exclude<typeof loop, { kind: "contested_claim" }> =>
            !("kind" in loop) || loop.kind !== "contested_claim",
        ),
        vitals,
        context,
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

function collectConstraints(
  ctx: ActiveContextReady,
  encounterId?: string,
): EventEnvelope[] {
  const canonical: EventEnvelope[] = [];
  const legacyStructural: EventEnvelope[] = [];
  for (const ev of ctx.events) {
    const isCanonicalConstraint =
      ev.type === "assessment" && ev.subtype === "constraint";
    const isLegacyStructuralConstraint = ev.type === "constraint_set";
    if (!isCanonicalConstraint && !isLegacyStructuralConstraint) continue;
    if (!eventMatchesEncounter(ev, encounterId)) continue;
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

function collectProblems(
  ctx: ActiveContextReady,
  encounterId?: string,
): EventEnvelope[] {
  const out: EventEnvelope[] = [];
  for (const ev of ctx.events) {
    if (ev.type !== "assessment") continue;
    if (ev.subtype !== "problem") continue;
    if (!eventMatchesEncounter(ev, encounterId)) continue;
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
  encounterId?: string,
): EventEnvelope[] {
  const out: EventEnvelope[] = [];
  for (const ev of ctx.events) {
    if (ev.type !== "observation") continue;
    if (!eventMatchesEncounter(ev, encounterId)) continue;
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

function collectActiveContextSegments(
  ctx: ActiveContextReady,
  encounterId?: string,
): Record<string, EventEnvelope> {
  const latest = new Map<string, { t: number; event: EventEnvelope }>();
  for (const ev of ctx.events) {
    if (ev.type !== "observation" || ev.subtype !== "context_segment") continue;
    if (!eventMatchesEncounter(ev, encounterId)) continue;
    if (isSuperseded(ev, ctx) || isCorrected(ev, ctx)) continue;
    if (!eventCoversAsOf(ev, ctx.asOfMs)) continue;
    const segmentType =
      typeof ev.data?.segment_type === "string" ? ev.data.segment_type : null;
    if (!segmentType) continue;
    const t = Date.parse(eventStartIso(ev) ?? "");
    const prior = latest.get(segmentType);
    if (!prior || (Number.isFinite(t) && t > prior.t)) {
      latest.set(segmentType, { t, event: ev });
    }
  }
  return Object.fromEntries(
    [...latest.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, value.event]),
  );
}

function eventMatchesEncounter(
  ev: EventEnvelope,
  encounterId: string | undefined,
): boolean {
  return !encounterId || typeof ev.encounter_id !== "string" || ev.encounter_id === encounterId;
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
      if (vitalQualityState(v.quality) === "invalid") continue;
      if (A1_CANONICAL_SHARED_METRICS.has(v.name) && !isProfileRoutedTrainingMetric(v)) {
        continue;
      }
      const t = Date.parse(v.sampled_at ?? "");
      if (!Number.isFinite(t) || t > asOfMs) continue;
      if (params.encounterId && v.encounter_id !== params.encounterId) continue;
      const source = formatSource(v.source);
      const point: TrendPoint = {
        sampled_at: v.sampled_at,
        recorded_at: v.recorded_at,
        sample_key: v.sample_key,
        value: v.value,
        unit: v.unit,
        source,
        context: v.context,
        quality: v.quality,
        profile: v.profile,
        training_label: v.training_label,
      };
      const prior = latest[v.name];
      if (!prior || t > prior.t) latest[v.name] = { t, point };
    }
  }
  const out: Record<string, TrendPoint> = {};
  for (const [name, entry] of Object.entries(latest)) out[name] = entry.point;
  return out;
}
