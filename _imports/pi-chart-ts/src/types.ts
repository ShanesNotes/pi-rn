// TypeScript projections of the JSON Schemas under ../schemas/.
// Schemas remain runtime source-of-truth; these types are an ergonomic
// projection. Keep the two in sync when either changes.

export type ClinicalType =
  | "observation"
  | "assessment"
  | "intent"
  | "action"
  | "communication"
  | "artifact_ref";

export type StructuralType = "subject" | "encounter" | "constraint_set";

export type EventType = ClinicalType | StructuralType;

export type Certainty =
  | "observed"
  | "reported"
  | "inferred"
  | "planned"
  | "performed";

export type Status =
  | "draft"
  | "active"
  | "final"
  | "superseded"
  | "entered_in_error";

export interface Author {
  id: string;
  role: string;
  run_id?: string;
}

export interface Source {
  kind: string;
  ref?: string;
}

export interface Links {
  /** Event ids OR vitals:// URIs. */
  supports?: string[];
  supersedes?: string[];
  corrects?: string[];
}

/** Base envelope for all events (clinical + structural). */
export interface EventEnvelope {
  id: string;
  type: EventType;
  subtype?: string;
  subject: string;
  encounter_id?: string;
  effective_at: string;
  recorded_at: string;
  author: Author;
  source: Source;
  certainty?: Certainty;
  status: Status;
  data?: Record<string, unknown>;
  links?: Links;
}

/** Clinical-event refinement: encounter_id, certainty, data, links required. */
export interface ClinicalEvent extends EventEnvelope {
  type: ClinicalType;
  encounter_id: string;
  certainty: Certainty;
  data: Record<string, unknown>;
  links: Links;
}

/** Input shape for appendEvent — id + recorded_at filled in if absent. */
export type EventInput = Omit<EventEnvelope, "id" | "recorded_at"> & {
  id?: string;
  recorded_at?: string;
};

export interface NoteFrontmatter {
  id: string;
  type: "communication";
  subtype?: string;
  subject: string;
  encounter_id: string;
  effective_at: string;
  recorded_at: string;
  author: Author;
  source: Source;
  references: string[];
  status: Status;
}

export type NoteFrontmatterInput =
  & Omit<NoteFrontmatter, "id" | "recorded_at" | "references">
  & { id?: string; recorded_at?: string; references?: string[] };

export interface VitalSample {
  sampled_at: string;
  subject: string;
  encounter_id: string;
  source: Source;
  name: string;
  value: number | string | boolean;
  unit?: string;
  context?: Record<string, unknown>;
  quality?: "valid" | "questionable" | "invalid";
  artifact?: string;
}

export type CodeStatus =
  | "full_code"
  | "dnr"
  | "dni"
  | "dnr_dni"
  | "comfort_only"
  | "unspecified";

export interface AllergyEntry {
  substance: string;
  reaction?: string;
  severity?: "mild" | "moderate" | "severe" | "anaphylaxis" | "unknown";
  source?: string;
  status: "active" | "inactive" | "entered_in_error";
}

export interface ConstraintsBlock {
  allergies?: AllergyEntry[];
  code_status?: CodeStatus;
  preferences?: string[];
  access_constraints?: string[];
  advance_directive?: string;
}

export interface ChartMeta {
  chart_id?: string;
  chart_version?: string;
  schema_version?: string;
  subject: string;
  mode?: "simulation" | "production";
  clock?: "sim_time" | "wall_time";
  sim_start?: string;
  created_at?: string;
  timezone?: string;
}

export interface ReportEntry {
  where: string;
  message: string;
}

export interface ValidationReport {
  ok: boolean;
  errors: ReportEntry[];
  warnings: ReportEntry[];
}
