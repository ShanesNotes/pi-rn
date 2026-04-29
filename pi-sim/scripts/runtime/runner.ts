import { createHash } from "node:crypto";
import { SimClock } from "./clock.js";
import { buildVitalFrame } from "./frame.js";
import { PublicTelemetryPublisher } from "./publisher.js";
import {
  ProviderUnavailableError,
  isProviderUnavailableError,
  type AssessmentRequest,
  type AssessmentUnavailableReason,
  type PhysiologyProvider,
  type ProviderAction,
  type ProviderAssessmentResult,
  type ProviderEncounterContext,
  type ProviderSnapshot,
  type PublicAssessmentEnvelope,
  type PublicAssessmentEvidenceRef,
  type PublicAssessmentFinding,
  type PublicAssessmentStatus,
  type PublicContextValue,
  type PublicEncounterContext,
  type PublicTelemetryEvent,
  type PublicTelemetryEventKind,
  type ProviderWaveformWindow,
  type RunState,
  type WaveformAvailabilityReason,
  type WaveformEnvelope,
} from "./provider.js";
import type { AlarmThresholds, VitalFrame } from "../types.js";

export interface ScheduledProviderAction {
  readonly t: number;
  readonly action: ProviderAction;
}

export interface RuntimeRunnerOptions {
  readonly provider: PhysiologyProvider;
  readonly publisher: PublicTelemetryPublisher;
  readonly thresholds: AlarmThresholds;
  readonly duration_s: number;
  readonly dt_s: number;
  readonly timeScale?: number;
  readonly actions?: readonly ScheduledProviderAction[];
  readonly now?: () => string;
  readonly onFrame?: (frame: VitalFrame) => void;
}

export interface RuntimeRunResult {
  readonly finalFrame: VitalFrame;
  readonly frames: readonly VitalFrame[];
}

interface PendingTelemetryEvent {
  readonly kind: PublicTelemetryEventKind;
  readonly runState: RunState;
  readonly snapshot: ProviderSnapshot;
  readonly payload: Record<string, unknown>;
}

interface PublicFrameMetadata {
  readonly sequence: number;
  readonly simTime_s: number;
  readonly wallTime: string;
  readonly source: string;
  readonly runState: RunState;
}

type PendingAssessment = PendingAssessmentUnavailable | PendingAssessmentReveal | PendingAssessmentReplay;

interface PendingAssessmentUnavailable {
  readonly kind: "unavailable";
  readonly request: AssessmentRequest;
  readonly reason: AssessmentUnavailableReason;
  readonly snapshot: ProviderSnapshot;
  readonly runState: RunState;
}

interface PendingAssessmentReveal {
  readonly kind: "reveal";
  readonly request: AssessmentRequest;
  readonly result: ProviderAssessmentResult;
  readonly snapshot: ProviderSnapshot;
  readonly runState: RunState;
  sequence?: number;
  digest?: string;
  envelope?: PublicAssessmentEnvelope;
}

interface PendingAssessmentReplay {
  readonly kind: "replay";
  readonly request: AssessmentRequest;
  readonly original: PendingAssessmentReveal | RevealedAssessmentRecord;
  readonly snapshot: ProviderSnapshot;
  readonly runState: RunState;
}

interface RevealedAssessmentRecord {
  readonly sequence: number;
  readonly digest: string;
  readonly envelope: PublicAssessmentEnvelope;
}

export async function runProviderRuntime(options: RuntimeRunnerOptions): Promise<RuntimeRunResult> {
  validateRunOptions(options.duration_s, options.dt_s, options.timeScale ?? 0);

  const clock = new SimClock();
  const frames: VitalFrame[] = [];
  const actions = [...(options.actions ?? [])]
    .filter((entry) => Number.isFinite(entry.t) && entry.t >= 0)
    .sort((a, b) => a.t - b.t);
  let nextActionIdx = 0;
  let snapshot: ProviderSnapshot | undefined;
  const pendingEvents: PendingTelemetryEvent[] = [];
  const pendingAssessments: PendingAssessment[] = [];
  const pendingRevealsByRequestId = new Map<string, PendingAssessmentReveal>();
  const revealedAssessments = new Map<string, RevealedAssessmentRecord>();
  const startedEncounterIds = new Set<string>();
  let lastEncounterKey: string | undefined;
  let lastAssessmentRequestId: string | null = null;
  let lastRevealSequence: number | null = null;
  const wallStart = Date.now();
  let nextEventIndex = 0;

  const appendEvent = (input: EventForInput): void => {
    options.publisher.appendEvent(eventFor({ ...input, eventIndex: nextEventIndex++ }));
  };

  const queueEvent = (
    kind: PublicTelemetryEventKind,
    runState: RunState,
    current: ProviderSnapshot,
    payload: Record<string, unknown>,
  ): void => {
    pendingEvents.push({ kind, runState, snapshot: current, payload });
  };

  const queueAssessment = async (request: AssessmentRequest, runState: RunState, current: ProviderSnapshot): Promise<void> => {
    lastAssessmentRequestId = request.requestId;
    const alreadyRevealed = revealedAssessments.get(request.requestId);
    if (alreadyRevealed) {
      pendingAssessments.push({ kind: "replay", request, original: alreadyRevealed, snapshot: current, runState });
      return;
    }

    const pendingReveal = pendingRevealsByRequestId.get(request.requestId);
    if (pendingReveal) {
      pendingAssessments.push({ kind: "replay", request, original: pendingReveal, snapshot: current, runState });
      return;
    }

    if (!options.provider.assess) {
      pendingAssessments.push({
        kind: "unavailable",
        request,
        reason: "provider_does_not_supply_assessments",
        snapshot: current,
        runState,
      });
      return;
    }

    const result = await options.provider.assess(request);
    if (!result) {
      pendingAssessments.push({ kind: "unavailable", request, reason: "assessment_not_available", snapshot: current, runState });
      return;
    }

    const reveal: PendingAssessmentReveal = { kind: "reveal", request, result, snapshot: current, runState };
    pendingAssessments.push(reveal);
    pendingRevealsByRequestId.set(request.requestId, reveal);
  };

  const applyScheduledAction = async (entry: ScheduledProviderAction, runState: RunState): Promise<void> => {
    snapshot = await options.provider.applyAction(entry.action);
    queueEvent("action_applied", runState, snapshot, { action: publicActionFor(entry.action) });
    const request = assessmentRequestFromAction(entry.action);
    if (request) await queueAssessment(request, runState, snapshot);
  };

  const publish = async (
    runState: RunState,
    current: ProviderSnapshot,
    unavailableReason: WaveformAvailabilityReason = "provider_does_not_supply_waveforms",
  ): Promise<VitalFrame> => {
    const wallTime = options.now?.() ?? new Date().toISOString();
    const frame = buildVitalFrame({
      snapshot: current,
      metadata: options.provider.metadata,
      sequence: clock.snapshot().sequence,
      runState,
      thresholds: options.thresholds,
      wallTime,
    });
    const metadata = publicFrameMetadataFor(frame, options.provider.metadata.source);

    for (const event of pendingEvents.splice(0)) {
      appendEvent({
        kind: event.kind,
        runState: event.runState,
        snapshot: event.snapshot,
        sequence: metadata.sequence,
        wallTime,
        source: metadata.source,
        payload: event.payload,
      });
    }

    const encounterContext = await options.provider.encounterContext?.();
    const publicEncounterContext = encounterContext ? publicEncounterContextFor(encounterContext, current, metadata) : undefined;
    options.publisher.publishEncounter(publicEncounterContext);
    if (publicEncounterContext) {
      const encounterKey = publicEncounterContext.encounterId;
      if (!startedEncounterIds.has(encounterKey)) {
        startedEncounterIds.add(encounterKey);
        appendEvent({
          kind: "encounter_started",
          runState,
          snapshot: current,
          sequence: metadata.sequence,
          wallTime,
          source: metadata.source,
          payload: encounterEventPayload(publicEncounterContext),
        });
      } else if (lastEncounterKey !== undefined && lastEncounterKey !== `${encounterKey}\u0000${publicEncounterContext.phase ?? ""}`) {
        appendEvent({
          kind: "encounter_phase_changed",
          runState,
          snapshot: current,
          sequence: metadata.sequence,
          wallTime,
          source: metadata.source,
          payload: encounterEventPayload(publicEncounterContext),
        });
      }
      lastEncounterKey = `${encounterKey}\u0000${publicEncounterContext.phase ?? ""}`;
    } else {
      lastEncounterKey = undefined;
    }

    let assessmentEnvelopeToPublish: PublicAssessmentEnvelope | undefined;
    let clearAssessmentCurrent = false;
    for (const pending of pendingAssessments.splice(0)) {
      appendEvent({
        kind: "assessment_requested",
        runState: pending.runState,
        snapshot: pending.snapshot,
        sequence: metadata.sequence,
        wallTime,
        source: metadata.source,
        payload: assessmentRequestPayload(pending.request),
      });

      if (pending.kind === "unavailable") {
        appendEvent({
          kind: "assessment_unavailable",
          runState: pending.runState,
          snapshot: pending.snapshot,
          sequence: metadata.sequence,
          wallTime,
          source: metadata.source,
          payload: { ...assessmentRequestPayload(pending.request), reason: pending.reason },
        });
        clearAssessmentCurrent = true;
        continue;
      }

      if (pending.kind === "replay") {
        const original = assessmentRecordForReplay(pending.original);
        lastRevealSequence = original.sequence;
        appendEvent({
          kind: "assessment_revealed",
          runState: pending.runState,
          snapshot: pending.snapshot,
          sequence: metadata.sequence,
          wallTime,
          source: metadata.source,
          payload: {
            ...assessmentRequestPayload(pending.request),
            replay: true,
            replayOfSequence: original.sequence,
            envelopeDigest: original.digest,
          },
        });
        continue;
      }

      const envelope = publicAssessmentEnvelopeFor(pending.result, pending.request, metadata);
      pending.sequence = envelope.sequence;
      pending.digest = envelope.envelopeDigest;
      pending.envelope = envelope;
      assessmentEnvelopeToPublish = envelope;
      lastRevealSequence = envelope.sequence;
      revealedAssessments.set(pending.request.requestId, {
        sequence: envelope.sequence,
        digest: envelope.envelopeDigest,
        envelope,
      });
      appendEvent({
        kind: "assessment_revealed",
        runState: pending.runState,
        snapshot: pending.snapshot,
        sequence: metadata.sequence,
        wallTime,
        source: metadata.source,
        payload: assessmentRevealPayload(envelope),
      });
    }

    const assessmentAvailable = Boolean(options.provider.assess);
    const assessmentStatus = publicAssessmentStatusFor({
      metadata,
      available: assessmentAvailable,
      reason: assessmentAvailable ? undefined : "provider_does_not_supply_assessments",
      lastRequestId: lastAssessmentRequestId,
      lastRevealSequence,
    });
    options.publisher.publishAssessment(
      assessmentStatus,
      assessmentEnvelopeToPublish,
      !assessmentAvailable || clearAssessmentCurrent || lastAssessmentRequestId === null,
    );

    options.publisher.publish(frame);
    await publishWaveformLane(options.provider, options.publisher, frame, unavailableReason);
    for (const alarm of frame.alarms) {
      appendEvent({
        kind: "alarm_observed",
        runState,
        snapshot: current,
        sequence: metadata.sequence,
        wallTime,
        source: metadata.source,
        payload: { alarm },
      });
    }
    frames.push(frame);
    options.onFrame?.(frame);
    return frame;
  };

  try {
    snapshot = await options.provider.init();
    queueEvent("run_started", "running", snapshot, { provider: options.provider.metadata.name });
    while (nextActionIdx < actions.length && actions[nextActionIdx].t <= clock.snapshot().simTime_s) {
      await applyScheduledAction(actions[nextActionIdx], "running");
      nextActionIdx += 1;
    }

    await publish("running", snapshot);

    while (clock.snapshot().simTime_s < options.duration_s) {
      const simTime = clock.snapshot().simTime_s;
      const remaining = options.duration_s - simTime;
      const nextActionTime = actions[nextActionIdx]?.t;
      const timeToNextAction =
        nextActionTime !== undefined && nextActionTime > simTime ? nextActionTime - simTime : Number.POSITIVE_INFINITY;
      const dt = Math.min(options.dt_s, remaining, timeToNextAction);
      const tick = clock.advance(dt);
      snapshot = await options.provider.advance(dt);
      while (nextActionIdx < actions.length && actions[nextActionIdx].t <= clock.snapshot().simTime_s) {
        await applyScheduledAction(actions[nextActionIdx], tick.runState);
        nextActionIdx += 1;
      }
      await publish(tick.runState, snapshot);

      const timeScale = options.timeScale ?? 0;
      if (timeScale > 0) {
        const wallTarget = wallStart + (clock.snapshot().simTime_s * 1000) / timeScale;
        const slack = wallTarget - Date.now();
        if (slack > 0) await new Promise((resolveSleep) => setTimeout(resolveSleep, slack));
      }
    }

    while (nextActionIdx < actions.length && actions[nextActionIdx].t <= options.duration_s) {
      await applyScheduledAction(actions[nextActionIdx], "running");
      nextActionIdx += 1;
    }

    const ended = clock.markEnded();
    const finalFrame = await publish(ended.runState, snapshot);
    appendEvent({
      kind: "run_ended",
      runState: "ended",
      snapshot,
      sequence: ended.sequence,
      wallTime: finalFrame.wallTime,
      source: options.provider.metadata.source,
      payload: { frames: frames.length, terminal: true, terminalReason: "normal_end" },
    });
    return { finalFrame, frames };
  } catch (error) {
    const unavailable = toUnavailable(error, options.provider.metadata.source);
    const fallbackSnapshot: ProviderSnapshot = snapshot ?? {
      t: clock.snapshot().simTime_s,
      vitals: {},
      events: ["PROVIDER_UNAVAILABLE"],
    };
    const unavailableSnapshot: ProviderSnapshot = {
      ...fallbackSnapshot,
      events: [...new Set([...fallbackSnapshot.events, "PROVIDER_UNAVAILABLE"])],
    };
    const frame = await publish("unavailable", unavailableSnapshot, "provider_unavailable");
    appendEvent({
      kind: "provider_unavailable",
      runState: "unavailable",
      snapshot: unavailableSnapshot,
      sequence: frame.monitor?.sequence ?? clock.snapshot().sequence,
      wallTime: frame.wallTime,
      source: options.provider.metadata.source,
      payload: { message: unavailable.message, terminal: true, terminalReason: "provider_unavailable" },
    });
    throw unavailable;
  }
}

interface EventForInput {
  readonly kind: PublicTelemetryEventKind;
  readonly runState: RunState;
  readonly snapshot: ProviderSnapshot;
  readonly sequence: number;
  readonly wallTime: string;
  readonly source: string;
  readonly payload: Record<string, unknown>;
}

function eventFor(input: EventForInput & { readonly eventIndex: number }): PublicTelemetryEvent {
  return {
    schemaVersion: 2,
    eventIndex: input.eventIndex,
    sequence: input.sequence,
    simTime_s: input.snapshot.t,
    wallTime: input.wallTime,
    source: input.source,
    runState: input.runState,
    kind: input.kind,
    payload: input.payload,
  };
}

function publicFrameMetadataFor(frame: VitalFrame, fallbackSource: string): PublicFrameMetadata {
  return {
    sequence: frame.monitor?.sequence ?? 0,
    simTime_s: frame.simTime_s ?? frame.t,
    wallTime: frame.wallTime,
    source: frame.monitor?.source ?? fallbackSource,
    runState: frame.monitor?.runState ?? "unavailable",
  };
}

function publicActionFor(action: ProviderAction): ProviderAction {
  const request = assessmentRequestFromAction(action);
  if (request) return { type: action.type, params: assessmentRequestPayload(request) };
  return { type: action.type };
}

function assessmentRequestFromAction(action: ProviderAction): AssessmentRequest | undefined {
  if (action.type !== "assessment_request") return undefined;
  const params = action.params ?? {};
  const requestId = stringField(params.requestId);
  const assessmentType = stringField(params.assessmentType);
  if (!requestId || !assessmentType) return undefined;
  const bodySystem = stringField(params.bodySystem);
  return bodySystem ? { requestId, assessmentType, bodySystem } : { requestId, assessmentType };
}

function publicEncounterContextFor(
  context: ProviderEncounterContext,
  snapshot: ProviderSnapshot,
  metadata: PublicFrameMetadata,
): PublicEncounterContext {
  const phase = context.phase ?? snapshot.phase;
  const display = sanitizeDisplayContext(context.display);
  const publicContext: PublicEncounterContext = {
    schemaVersion: 1,
    patientId: context.patientId,
    encounterId: context.encounterId,
    visibleChartAsOf: context.visibleChartAsOf,
    sequence: metadata.sequence,
    simTime_s: metadata.simTime_s,
    wallTime: metadata.wallTime,
    source: metadata.source,
    runState: metadata.runState,
  };
  if (phase) return display ? { ...publicContext, phase, display } : { ...publicContext, phase };
  return display ? { ...publicContext, display } : publicContext;
}

function publicAssessmentStatusFor(input: {
  readonly metadata: PublicFrameMetadata;
  readonly available: boolean;
  readonly reason?: AssessmentUnavailableReason;
  readonly lastRequestId: string | null;
  readonly lastRevealSequence: number | null;
}): PublicAssessmentStatus {
  const status: PublicAssessmentStatus = {
    schemaVersion: 1,
    sequence: input.metadata.sequence,
    simTime_s: input.metadata.simTime_s,
    wallTime: input.metadata.wallTime,
    source: input.metadata.source,
    runState: input.metadata.runState,
    available: input.available,
    lastRequestId: input.lastRequestId,
    lastRevealSequence: input.lastRevealSequence,
  };
  return input.reason ? { ...status, reason: input.reason } : status;
}

function publicAssessmentEnvelopeFor(
  result: ProviderAssessmentResult,
  request: AssessmentRequest,
  metadata: PublicFrameMetadata,
): PublicAssessmentEnvelope {
  const findings = result.findings.map((finding): PublicAssessmentFinding => {
    const publicFinding: PublicAssessmentFinding = {
      id: finding.id,
      label: finding.label,
      value: finding.value,
    };
    const withSeverity = finding.severity ? { ...publicFinding, severity: finding.severity } : publicFinding;
    return finding.evidence ? { ...withSeverity, evidence: finding.evidence.map(publicEvidenceRefFor) } : withSeverity;
  });
  const bodySystem = result.bodySystem ?? request.bodySystem;
  const envelopeWithoutDigest: Omit<PublicAssessmentEnvelope, "envelopeDigest"> = {
    schemaVersion: 1,
    requestId: request.requestId,
    assessmentType: result.assessmentType ?? request.assessmentType,
    visibility: "revealed",
    sequence: metadata.sequence,
    simTime_s: metadata.simTime_s,
    wallTime: metadata.wallTime,
    source: metadata.source,
    runState: metadata.runState,
    findings,
  };
  const withBodySystem = bodySystem ? { ...envelopeWithoutDigest, bodySystem } : envelopeWithoutDigest;
  const withSummary = result.summary ? { ...withBodySystem, summary: result.summary } : withBodySystem;
  const withEvidence = result.evidence ? { ...withSummary, evidence: result.evidence.map(publicEvidenceRefFor) } : withSummary;
  return { ...withEvidence, envelopeDigest: digestPublicJson(withEvidence) };
}

function publicEvidenceRefFor(ref: PublicAssessmentEvidenceRef): PublicAssessmentEvidenceRef {
  const publicRef: PublicAssessmentEvidenceRef = { kind: ref.kind, ref: ref.ref };
  return ref.role ? { ...publicRef, role: ref.role } : publicRef;
}

function assessmentRequestPayload(request: AssessmentRequest): Record<string, unknown> {
  return request.bodySystem
    ? { requestId: request.requestId, assessmentType: request.assessmentType, bodySystem: request.bodySystem }
    : { requestId: request.requestId, assessmentType: request.assessmentType };
}

function assessmentRevealPayload(envelope: PublicAssessmentEnvelope): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    requestId: envelope.requestId,
    assessmentType: envelope.assessmentType,
    visibility: envelope.visibility,
    findings: envelope.findings,
    envelopeDigest: envelope.envelopeDigest,
  };
  if (envelope.bodySystem) payload.bodySystem = envelope.bodySystem;
  if (envelope.summary) payload.summary = envelope.summary;
  if (envelope.evidence) payload.evidence = envelope.evidence;
  return payload;
}

function encounterEventPayload(context: PublicEncounterContext): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    patientId: context.patientId,
    encounterId: context.encounterId,
    visibleChartAsOf: context.visibleChartAsOf,
  };
  if (context.phase) payload.phase = context.phase;
  if (context.display) payload.display = context.display;
  return payload;
}

function assessmentRecordForReplay(original: PendingAssessmentReveal | RevealedAssessmentRecord): RevealedAssessmentRecord {
  if (original.envelope && original.digest && original.sequence !== undefined) {
    return { sequence: original.sequence, digest: original.digest, envelope: original.envelope };
  }
  throw new Error("assessment replay original has not been published yet");
}

function sanitizeDisplayContext(display: Record<string, PublicContextValue> | undefined): Record<string, PublicContextValue> | undefined {
  if (!display) return undefined;
  const sanitized: Record<string, PublicContextValue> = {};
  for (const [key, value] of Object.entries(display)) {
    if (["string", "number", "boolean"].includes(typeof value) || value === null) sanitized[key] = value;
  }
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function stringField(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

async function publishWaveformLane(
  provider: PhysiologyProvider,
  publisher: PublicTelemetryPublisher,
  frame: VitalFrame,
  unavailableReason: WaveformAvailabilityReason,
): Promise<void> {
  const sequence = frame.monitor?.sequence ?? 0;
  const source = frame.monitor?.source ?? provider.metadata.source;
  const runState = frame.monitor?.runState ?? "unavailable";
  const simTime_s = frame.simTime_s ?? frame.t;
  const wallTime = frame.wallTime;

  const providerWindow = await provider.waveformWindow?.();
  if (!providerWindow) {
    publisher.publishWaveform({
      schemaVersion: 1,
      sequence,
      simTime_s,
      wallTime,
      source,
      runState,
      available: false,
      reason: unavailableReason,
    });
    return;
  }

  const envelope = waveformEnvelope(providerWindow, { sequence, simTime_s, wallTime, source, runState });
  publisher.publishWaveform({
    schemaVersion: 1,
    sequence,
    simTime_s,
    wallTime,
    source,
    runState,
    available: true,
    sourceKind: envelope.sourceKind,
    fidelity: envelope.fidelity,
    synthetic: envelope.synthetic,
  }, envelope);
}

function waveformEnvelope(
  providerWindow: ProviderWaveformWindow,
  metadata: Pick<WaveformEnvelope, "sequence" | "simTime_s" | "wallTime" | "source" | "runState">,
): WaveformEnvelope {
  return {
    schemaVersion: 1,
    sequence: metadata.sequence,
    simTime_s: metadata.simTime_s,
    wallTime: metadata.wallTime,
    source: metadata.source,
    runState: metadata.runState,
    available: true,
    sourceKind: providerWindow.sourceKind,
    fidelity: providerWindow.fidelity,
    synthetic: providerWindow.synthetic,
    windows: providerWindow.windows,
  };
}

function digestPublicJson(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(",")}}`;
}

function validateRunOptions(duration_s: number, dt_s: number, timeScale: number): void {
  if (!Number.isFinite(duration_s) || duration_s < 0) throw new Error(`duration_s must be >= 0, got ${duration_s}`);
  if (!Number.isFinite(dt_s) || dt_s <= 0) throw new Error(`dt_s must be positive, got ${dt_s}`);
  if (!Number.isFinite(timeScale) || timeScale < 0) throw new Error(`timeScale must be >= 0, got ${timeScale}`);
}

function toUnavailable(error: unknown, source: string): ProviderUnavailableError {
  if (isProviderUnavailableError(error)) return error;
  const message = error instanceof Error ? error.message : String(error);
  return new ProviderUnavailableError(`${source} unavailable: ${message}`, error);
}
