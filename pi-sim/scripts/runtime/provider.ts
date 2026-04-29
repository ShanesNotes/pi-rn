export type RunState = "running" | "paused" | "ended" | "unavailable";

export type MaybePromise<T> = T | Promise<T>;

export type VitalScalars = Partial<Record<
  | "hr"
  | "map"
  | "bp_sys"
  | "bp_dia"
  | "rr"
  | "spo2"
  | "temp_c"
  | "cardiac_output_lpm"
  | "stroke_volume_ml"
  | "etco2_mmHg"
  | "pao2_mmHg"
  | "paco2_mmHg"
  | "urine_ml_hr"
  | "ph"
  | "lactate_mmol_l"
  | "hgb_g_dl",
  number
>>;

export interface ProviderMetadata {
  readonly name: string;
  readonly source: string;
  readonly fidelity: "scripted-demo" | "physiology-provider" | "fixture";
}

export interface ProviderAction {
  readonly type: string;
  readonly params?: Record<string, unknown>;
}

export interface ProviderSnapshot {
  readonly t: number;
  readonly phase?: string;
  readonly vitals: VitalScalars;
  readonly events: string[];
}

export type PublicTelemetryEventKind =
  | "run_started"
  | "action_applied"
  | "alarm_observed"
  | "provider_unavailable"
  | "run_ended"
  | "encounter_started"
  | "encounter_phase_changed"
  | "assessment_requested"
  | "assessment_revealed"
  | "assessment_unavailable";

export interface PublicTelemetryEvent {
  readonly schemaVersion: 2;
  readonly eventIndex: number;
  readonly sequence: number;
  readonly simTime_s: number;
  readonly wallTime: string;
  readonly source: string;
  readonly runState: RunState;
  readonly kind: PublicTelemetryEventKind;
  readonly payload: Record<string, unknown>;
}

export type WaveformAvailabilityReason =
  | "provider_does_not_supply_waveforms"
  | "provider_unavailable"
  | "waveform_not_available";

export type WaveformSourceKind = "provider" | "fixture" | "demo";
export type WaveformFidelity = "provider" | "fixture" | "demo";

export interface WaveformWindow {
  readonly unit: string;
  readonly sampleRate_Hz: number;
  readonly t0_s: number;
  readonly values: readonly number[];
}

export interface ProviderWaveformWindow {
  readonly sourceKind: WaveformSourceKind;
  readonly fidelity: WaveformFidelity;
  readonly synthetic: boolean;
  readonly windows: Record<string, WaveformWindow>;
}

export interface WaveformStatus {
  readonly schemaVersion: 1;
  readonly sequence: number;
  readonly simTime_s: number;
  readonly wallTime: string;
  readonly source: string;
  readonly runState: RunState;
  readonly available: boolean;
  readonly reason?: WaveformAvailabilityReason;
  readonly sourceKind?: WaveformSourceKind;
  readonly fidelity?: WaveformFidelity;
  readonly synthetic?: boolean;
}

export interface WaveformEnvelope {
  readonly schemaVersion: 1;
  readonly sequence: number;
  readonly simTime_s: number;
  readonly wallTime: string;
  readonly source: string;
  readonly runState: RunState;
  readonly available: true;
  readonly sourceKind: WaveformSourceKind;
  readonly fidelity: WaveformFidelity;
  readonly synthetic: boolean;
  readonly windows: Record<string, WaveformWindow>;
}

export type PublicContextValue = string | number | boolean | null;

export interface ProviderEncounterContext {
  readonly patientId: string;
  readonly encounterId: string;
  readonly visibleChartAsOf: string;
  readonly phase?: string;
  readonly display?: Record<string, PublicContextValue>;
}

export interface PublicEncounterContext {
  readonly schemaVersion: 1;
  readonly patientId: string;
  readonly encounterId: string;
  readonly visibleChartAsOf: string;
  readonly phase?: string;
  readonly sequence: number;
  readonly simTime_s: number;
  readonly wallTime: string;
  readonly source: string;
  readonly runState: RunState;
  readonly display?: Record<string, PublicContextValue>;
}

export type AssessmentUnavailableReason =
  | "provider_does_not_supply_assessments"
  | "assessment_not_available"
  | "provider_unavailable";

export interface AssessmentRequest {
  readonly requestId: string;
  readonly assessmentType: string;
  readonly bodySystem?: string;
}

export interface PublicAssessmentEvidenceRef {
  readonly kind: "event" | "vitals_window" | "encounter";
  readonly ref: string;
  readonly role?: "primary" | "context" | "supporting";
}

export interface ProviderAssessmentFinding {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly severity?: string;
  readonly evidence?: readonly PublicAssessmentEvidenceRef[];
}

export interface PublicAssessmentFinding {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly severity?: string;
  readonly evidence?: readonly PublicAssessmentEvidenceRef[];
}

export interface ProviderAssessmentResult {
  readonly requestId?: string;
  readonly assessmentType?: string;
  readonly bodySystem?: string;
  readonly findings: readonly ProviderAssessmentFinding[];
  readonly summary?: string;
  readonly evidence?: readonly PublicAssessmentEvidenceRef[];
}

export interface PublicAssessmentStatus {
  readonly schemaVersion: 1;
  readonly sequence: number;
  readonly simTime_s: number;
  readonly wallTime: string;
  readonly source: string;
  readonly runState: RunState;
  readonly available: boolean;
  readonly reason?: AssessmentUnavailableReason;
  readonly lastRequestId: string | null;
  readonly lastRevealSequence: number | null;
}

export interface PublicAssessmentEnvelope {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly assessmentType: string;
  readonly bodySystem?: string;
  readonly visibility: "revealed";
  readonly sequence: number;
  readonly simTime_s: number;
  readonly wallTime: string;
  readonly source: string;
  readonly runState: RunState;
  readonly findings: readonly PublicAssessmentFinding[];
  readonly summary?: string;
  readonly evidence?: readonly PublicAssessmentEvidenceRef[];
  readonly envelopeDigest: string;
}

export interface PhysiologyProvider {
  readonly metadata: ProviderMetadata;
  init(): MaybePromise<ProviderSnapshot>;
  advance(dtSeconds: number): MaybePromise<ProviderSnapshot>;
  applyAction(action: ProviderAction): MaybePromise<ProviderSnapshot>;
  snapshot(): MaybePromise<ProviderSnapshot>;
  waveformWindow?(): MaybePromise<ProviderWaveformWindow | undefined>;
  encounterContext?(): MaybePromise<ProviderEncounterContext | undefined>;
  assess?(request: AssessmentRequest): MaybePromise<ProviderAssessmentResult | undefined>;
}

export class ProviderUnavailableError extends Error {
  readonly causeUnknown: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ProviderUnavailableError";
    this.causeUnknown = cause;
  }
}

export function isProviderUnavailableError(error: unknown): error is ProviderUnavailableError {
  return error instanceof ProviderUnavailableError;
}
