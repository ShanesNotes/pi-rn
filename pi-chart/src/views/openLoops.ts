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
// Open ambiguity noted at build time: the Status enum (types.ts) has no
// `"failed"` value. We interpret DESIGN §4.6 "failed" as either a
// fulfillment carrying `status: "entered_in_error"` OR a fulfillment
// event whose `data.outcome === "failed"`. If MIMIC ingestion or
// pi-agent writes surface a need for a first-class `"failed"` status,
// revisit with a schema_version bump.

import {
  isCorrected,
  isSuperseded,
  isVisibleAsOf,
  loadContext,
} from "./active.js";
import type {
  ActiveContext,
} from "./active.js";
import type {
  EventEnvelope,
  OpenLoop,
  OpenLoopState,
  OpenLoopsParams,
} from "../types.js";

export async function openLoops(params: OpenLoopsParams): Promise<OpenLoop[]> {
  const ctx = await loadContext(params.scope, params.asOf);
  const asOfMs = ctx.asOfMs;

  const fulfillmentsByIntent = indexFulfillments(ctx.events);

  const out: OpenLoop[] = [];
  for (const intent of ctx.events) {
    if (intent.type !== "intent") continue;
    // An intent authored after `asOf` is not yet visible; skip it so
    // callers can time-travel without seeing future loops.
    if (!isVisibleAsOf(intent, ctx)) continue;
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
    if (hasTerminalFinalFulfillment(fulfillments)) continue;

    const dueBy = readDueBy(intent);
    const state = computeState(fulfillments, dueBy, asOfMs);
    const addressesProblems = resolveAddressesProblems(intent, ctx);

    out.push({
      intent,
      state,
      fulfillments,
      addressesProblems,
      ...(dueBy !== null && Number.isFinite(asOfMs)
        ? { dueDeltaMinutes: Math.round((dueBy - asOfMs) / 60000) }
        : {}),
    });
  }

  out.sort((a, b) =>
    a.intent.effective_at.localeCompare(b.intent.effective_at) ||
    a.intent.id.localeCompare(b.intent.id),
  );
  return out;
}

function indexFulfillments(events: EventEnvelope[]): Map<string, EventEnvelope[]> {
  const out = new Map<string, EventEnvelope[]>();
  for (const ev of events) {
    for (const targetId of ev.links?.fulfills ?? []) {
      if (!out.has(targetId)) out.set(targetId, []);
      out.get(targetId)!.push(ev);
    }
  }
  return out;
}

function hasTerminalFinalFulfillment(fulfillments: EventEnvelope[]): boolean {
  return fulfillments.some((f) => f.status === "final");
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
  const outcome = (f.data as any)?.outcome;
  if (typeof outcome === "string" && /^(failed|failure|refused|aborted)$/i.test(outcome)) {
    return true;
  }
  return false;
}

function readDueBy(intent: EventEnvelope): number | null {
  const raw = (intent.data as any)?.due_by;
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
