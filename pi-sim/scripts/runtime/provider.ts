export type RunState = "running" | "paused" | "ended" | "unavailable";

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
  init(): ProviderSnapshot;
  advance(dtSeconds: number): ProviderSnapshot;
  applyAction(action: ProviderAction): ProviderSnapshot;
  snapshot(): ProviderSnapshot;
  waveformWindow?(): undefined;
}
