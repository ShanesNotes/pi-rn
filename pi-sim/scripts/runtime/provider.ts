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

export interface PhysiologyProvider {
  readonly metadata: ProviderMetadata;
  init(): MaybePromise<ProviderSnapshot>;
  advance(dtSeconds: number): MaybePromise<ProviderSnapshot>;
  applyAction(action: ProviderAction): MaybePromise<ProviderSnapshot>;
  snapshot(): MaybePromise<ProviderSnapshot>;
  waveformWindow?(): undefined;
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
