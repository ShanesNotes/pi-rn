// TypeScript projections of the JSON Schemas under ../schemas/.
// Schemas remain runtime source-of-truth; these types are an ergonomic
// projection. Keep the two in sync when either changes.

import path from "node:path";

/**
 * Scopes every read/write to a single patient directory inside the repo.
 * `chartRoot` points at the pi-chart repo (the directory holding
 * `pi-chart.yaml`); `patientId` names the subdir under `patients/`.
 * Library callers must always pass this explicitly; CLI wrappers may
 * default `chartRoot` to `process.cwd()`.
 */
export interface PatientScope {
  chartRoot: string;
  patientId: string;
}

/** Filesystem path to `<chartRoot>/patients/<patientId>/`. */
export function patientRoot(scope: PatientScope): string {
  return path.join(scope.chartRoot, "patients", scope.patientId);
}

/** One entry in the root `pi-chart.yaml` registry. */
export interface SystemRegistryEntry {
  id: string;
  directory: string;
  display_name?: string;
  created_at?: string;
  source?: "synthetic" | "mimic_iv_import" | "manual";
}

/** Shape of the root `pi-chart.yaml` registry. */
export interface SystemRegistry {
  system_version: string;
  schema_version: string;
  default_timezone?: string;
  patients: SystemRegistryEntry[];
}

/** Shape of `sessions/current.yaml` (gitignored, single-user for v0.2). */
export interface SessionState {
  author?: Author;
  current_patient?: string;
  current_encounter?: string;
}

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

/**
 * Canonical evidence reference union. Bare strings in `links.supports`
 * are still accepted on the wire (back-compat: event/note ids; vitals://
 * URIs) and parse into one of these kinds. Writers may emit either form;
 * readers normalize via `parseEvidenceRef`.
 */
export type EvidenceRef =
  | { kind: "event"; id: string }
  | {
      kind: "vitals";
      metric: string;
      from: string;            // ISO 8601
      to: string;              // ISO 8601
      encounterId?: string;
    }
  | { kind: "note"; id: string }
  | { kind: "artifact"; id: string };

export interface Links {
  /** Evidence this claim rests on. Mix of bare ids, vitals:// URIs, or EvidenceRef objects. */
  supports?: Array<string | EvidenceRef>;
  supersedes?: string[];
  corrects?: string[];
  /** Action/outcome → intent; validator enforces intent typing. */
  fulfills?: string[];
  /** Intent/action → problem (or intent). Validator enforces target typing. */
  addresses?: string[];
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

// --------------------------------------------------------------------
// View-primitive types (DESIGN §4)
// --------------------------------------------------------------------

export type Axis = "constraints" | "problems" | "intents" | "vitals" | "all";

export interface TimelineParams {
  scope: PatientScope;
  from?: string;
  to?: string;
  types?: ClinicalType[];
  subtypes?: string[];
  subtypePrefix?: string;
  encounterId?: string;
  includeSuperseded?: boolean;
}

export interface TimelineEntry {
  id: string;
  type: ClinicalType;
  subtype?: string;
  effective_at: string;
  author: Author;
  summary: string;
  raw: EventEnvelope;
}

export interface TrendParams {
  scope: PatientScope;
  metric: string;
  from: string;
  to: string;
  source?: string;
  encounterId?: string;
}

export interface TrendPoint {
  sampled_at: string;
  value: number | string;
  unit?: string;
  source: string;
  context?: Record<string, unknown>;
}

export interface CurrentStateParams {
  scope: PatientScope;
  asOf?: string;
  axis: Axis;
}

export interface OpenLoopsParams {
  scope: PatientScope;
  asOf?: string;
}

export type OpenLoopState = "pending" | "in_progress" | "overdue" | "failed";

export interface OpenLoop {
  intent: EventEnvelope;
  state: OpenLoopState;
  fulfillments: EventEnvelope[];
  dueDeltaMinutes?: number;
  addressesProblems: EventEnvelope[];
}

export type CurrentState =
  | { axis: "constraints"; items: EventEnvelope[] }
  | { axis: "problems"; items: EventEnvelope[] }
  | { axis: "intents"; items: OpenLoop[] }
  | { axis: "vitals"; items: Record<string, TrendPoint> }
  | {
      axis: "all";
      constraints: EventEnvelope[];
      problems: EventEnvelope[];
      intents: OpenLoop[];
      vitals: Record<string, TrendPoint>;
    };

export interface NarrativeParams {
  scope: PatientScope;
  from?: string;
  to?: string;
  encounterId?: string;
  authorId?: string;
  subtypes?: string[];
}

export interface NarrativeEntry {
  id: string;
  effective_at: string;
  recorded_at: string;
  author: Author;
  subtype: string;
  body: string;
  references: string[];
  path: string;
}

export interface ArtifactPointer {
  id: string;
  path: string;
}

export type EvidenceNode =
  | { kind: "event"; event: EventEnvelope; supports: EvidenceNode[]; supersedes: EventEnvelope[] }
  | { kind: "vitals"; metric: string; points: TrendPoint[] }
  | { kind: "note"; note: NarrativeEntry }
  | { kind: "artifact"; artifact: ArtifactPointer };

export interface EvidenceChainParams {
  scope: PatientScope;
  eventId: string;
  depth?: number;
}
