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

export interface EffectivePeriod {
  start: string;
  end?: string;
}

/**
 * Canonical evidence reference shape. Bare strings in `links.supports`
 * are still accepted on the wire (back-compat: event/note ids; vitals://
 * URIs); readers normalize them via `parseEvidenceRef`.
 */
export type EvidenceRole =
  | "primary"
  | "context"
  | "counterevidence"
  | "trigger"
  | "confirmatory";

export type EvidenceKind =
  | "event"
  | "vitals_window"
  | "note"
  | "artifact"
  | "external"
  | "vitals";

export interface EvidenceRef {
  ref: string;
  kind: EvidenceKind;
  role?: EvidenceRole;
  basis?: string;
  selection?: Record<string, unknown>;
  derived_from?: EvidenceRef[];
}

export interface ContradictsLink {
  ref: string;
  basis: string;
}

export type TransformActivity =
  | "import"
  | "normalize"
  | "extract"
  | "summarize"
  | "infer"
  | "transcribe";

export interface TransformBlock {
  activity: TransformActivity;
  tool: string;
  version?: string;
  run_id?: string;
  input_refs?: EvidenceRef[];
}

export interface Links {
  /** Evidence this claim rests on. Mix of bare ids, vitals:// URIs, or EvidenceRef objects. */
  supports?: Array<string | EvidenceRef>;
  supersedes?: string[];
  corrects?: string[];
  /** Action/outcome → intent; validator enforces intent typing. */
  fulfills?: string[];
  /** Intent/action → problem; validator enforces target typing. */
  addresses?: string[];
  resolves?: string[];
  contradicts?: ContradictsLink[];
}

export interface EventEnvelopeBase {
  id: string;
  type: EventType;
  subtype?: string;
  subject: string;
  encounter_id?: string;
  recorded_at: string;
  author: Author;
  source: Source;
  transform?: TransformBlock;
  certainty?: Certainty;
  status: Status;
  data?: Record<string, unknown>;
  links?: Links;
}

export type EventEnvelope =
  & EventEnvelopeBase
  & (
    | { effective_at: string; effective_period?: never }
    | { effective_at?: never; effective_period: EffectivePeriod }
  );

/** Clinical-event refinement: encounter_id, certainty, data, links required. */
export type ClinicalEvent = EventEnvelope & {
  type: ClinicalType;
  encounter_id: string;
  certainty: Certainty;
  data: Record<string, unknown>;
  links: Links;
};

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
  effective_start: string;
  author: Author;
  summary: string;
  raw: EventEnvelope;
  /** Set when this entry's `links.contradicts` points at an earlier entry in the same timeline window. */
  contradicts_prev_id?: string;
  /** Mirror of `contradicts_prev_id`: set on the earlier entry when a later entry contradicts it. */
  contradicted_by_next_id?: string;
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

export type OpenLoopKind =
  | "pending_intent"
  | "overdue_intent"
  | "unacknowledged_communication"
  | "contested_claim";

export type OpenLoopState = "pending" | "in_progress" | "overdue" | "failed";

export interface OpenLoop {
  intent: EventEnvelope;
  state: OpenLoopState;
  fulfillments: EventEnvelope[];
  dueDeltaMinutes?: number;
  addressesProblems: EventEnvelope[];
}

export type ContestedAxis =
  | "constraints"
  | "problems"
  | "intents"
  | "observations";

/**
 * A contested-pair entry surfaced on `currentState(...)`'s per-axis view.
 * Two envelope ids that stand in `links.contradicts` tension, classified
 * by the clinical axis they share.
 */
export interface ContestedRuntimeEntry {
  events: [string, string];
  basis: string;
  axis: ContestedAxis;
}

/**
 * An `openLoops(...)` entry representing a standing `contradicts` edge
 * that has aged past its threshold. Shares `OpenLoop`'s shape so callers
 * can iterate both in one pass, but narrowable by `kind === "contested_claim"`.
 */
export interface ContestedClaim extends OpenLoop {
  kind: "contested_claim";
  events: [string, string];
  basis: string;
  age_seconds: number;
  threshold_seconds: number;
  severity: "medium" | "high";
}

export type CurrentState =
  | {
      axis: "constraints";
      items: EventEnvelope[];
      contested?: ContestedRuntimeEntry[];
    }
  | {
      axis: "problems";
      items: EventEnvelope[];
      contested?: ContestedRuntimeEntry[];
    }
  | {
      axis: "intents";
      items: OpenLoop[];
      contested?: ContestedRuntimeEntry[];
    }
  | { axis: "vitals"; items: Record<string, TrendPoint> }
  | {
      axis: "all";
      constraints: EventEnvelope[];
      problems: EventEnvelope[];
      intents: OpenLoop[];
      vitals: Record<string, TrendPoint>;
      observations: EventEnvelope[];
      contested?: {
        constraints: ContestedRuntimeEntry[];
        problems: ContestedRuntimeEntry[];
        intents: ContestedRuntimeEntry[];
        observations: ContestedRuntimeEntry[];
      };
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
  | {
      kind: "event";
      event: EventEnvelope;
      supports: EvidenceNode[];
      supersedes: EventEnvelope[];
      role?: EvidenceRole;
      contradicts?: EvidenceNode[];
    }
  | { kind: "vitals"; metric: string; points: TrendPoint[]; role?: EvidenceRole }
  | { kind: "note"; note: NarrativeEntry; role?: EvidenceRole }
  | { kind: "artifact"; artifact: ArtifactPointer; role?: EvidenceRole };

export interface EvidenceChainParams {
  scope: PatientScope;
  eventId: string;
  depth?: number;
}
