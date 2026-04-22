export interface VitalFrame {
  t: number;
  wallTime: string;
  hr?: number;
  map?: number;
  bp_sys?: number;
  bp_dia?: number;
  rr?: number;
  spo2?: number;
  temp_c?: number;
  cardiac_output_lpm?: number;
  stroke_volume_ml?: number;
  etco2_mmHg?: number;
  pao2_mmHg?: number;
  paco2_mmHg?: number;
  urine_ml_hr?: number;
  ph?: number;
  lactate_mmol_l?: number;
  hgb_g_dl?: number;
  alarms: string[];
}

export type NumericField =
  | "hr" | "map" | "bp_sys" | "bp_dia" | "rr" | "spo2" | "temp_c"
  | "cardiac_output_lpm" | "stroke_volume_ml"
  | "etco2_mmHg" | "pao2_mmHg" | "paco2_mmHg"
  | "urine_ml_hr" | "ph" | "lactate_mmol_l" | "hgb_g_dl";

export interface ActionCall {
  type: string;
  params: Record<string, unknown>;
}

export interface TimelineEntry {
  t: number;
  action: ActionCall;
}

export interface Checkpoint {
  t: number;
  phase?: string;
  expect: Partial<Record<NumericField, [number, number]>>;
}

export interface Scenario {
  name: string;
  description?: string;
  state_file: string;
  state_bake?: { command: string };
  duration_s: number;
  timeline: TimelineEntry[];
  checkpoints: Checkpoint[];
}

export interface AlarmThresholds {
  [field: string]: { low?: number; high?: number };
}
