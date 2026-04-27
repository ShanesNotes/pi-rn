import { createHash } from "node:crypto";

export type VitalQualityState = "valid" | "questionable" | "invalid";

export const CORE_VITAL_METRICS = new Set([
  "spo2",
  "heart_rate",
  "respiratory_rate",
  "bp_systolic",
  "bp_diastolic",
  "map",
  "temperature",
  "temp_c",
  "blood_pressure",
  "etco2_mmhg",
  "level_of_consciousness",
  "urine_ml_hr",
]);

export const A1_CANONICAL_SHARED_METRICS = new Set([
  "lactate",
  "lactate_mmol_l",
  "ph",
  "pao2_mmhg",
  "paco2_mmhg",
  "hgb_g_dl",
  "hemoglobin",
]);

export function vitalQualityState(raw: unknown): VitalQualityState {
  if (raw === "questionable" || raw === "invalid" || raw === "valid") return raw;
  if (raw && typeof raw === "object") {
    const state = (raw as { state?: unknown }).state;
    if (state === "questionable" || state === "invalid" || state === "valid") {
      return state;
    }
  }
  return "valid";
}

export function normalizeVitalValueForSampleKey(value: unknown): string | null {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : null;
  if (typeof value === "string") return value.trim().normalize("NFC");
  if (typeof value === "boolean") return value ? "true" : "false";
  return null;
}

export function formatVitalSampleKey(sample: {
  subject?: unknown;
  encounter_id?: unknown;
  name?: unknown;
  sampled_at?: unknown;
  source?: { kind?: unknown; ref?: unknown };
  value?: unknown;
  unit?: unknown;
}): string | null {
  const normalizedValue = normalizeVitalValueForSampleKey(sample.value);
  if (
    typeof sample.subject !== "string" ||
    typeof sample.encounter_id !== "string" ||
    typeof sample.name !== "string" ||
    typeof sample.sampled_at !== "string" ||
    !sample.source ||
    typeof sample.source.kind !== "string" ||
    normalizedValue === null
  ) {
    return null;
  }
  const parts = [
    sample.subject,
    sample.encounter_id,
    sample.name,
    sample.sampled_at,
    sample.source.kind,
    typeof sample.source.ref === "string" ? sample.source.ref : "",
    normalizedValue,
    typeof sample.unit === "string" ? sample.unit : "",
  ];
  const digest = createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 16);
  return `vital_${digest}`;
}

export function isProfileRoutedTrainingMetric(sample: {
  profile?: unknown;
  training_label?: unknown;
}): boolean {
  if (typeof sample.training_label === "string" && sample.training_label.length > 0) return true;
  return typeof sample.profile === "string" && /training|simulation|sim/i.test(sample.profile);
}
