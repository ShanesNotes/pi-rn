import type { Source } from "./types.js";

export type AuthorshipClass =
  | "human-authored"
  | "agent-authored"
  | "agent-on-behalf-of-human"
  | "device-authored"
  | "imported"
  | "unknown";

export const SOURCE_KIND_CANONICAL: ReadonlySet<string> = new Set([
  "patient_statement",
  "admission_intake",
  "nurse_charted",
  "clinician_chart_action",
  "protocol_standing_order",
  "manual_lab_entry",
  "monitor_extension",
  "poc_device",
  "lab_analyzer",
  "lab_interface_hl7",
  "pacs_interface",
  "dictation_system",
  "pathology_lis",
  "cardiology_reporting",
  "endoscopy_reporting",
  "agent_inference",
  "agent_bedside_observation",
  "agent_action",
  "agent_synthesis",
  "agent_reasoning",
  "agent_review",
  "synthea_import",
  "mimic_iv_import",
  "manual_scenario",
]);

export const AGENT_REVIEWER_SOURCE_KINDS: ReadonlySet<string> = new Set([
  "agent_inference",
  "agent_synthesis",
  "agent_bedside_observation",
  "agent_action",
  "agent_review",
  "agent_reasoning",
]);

export const HUMAN_REVIEWER_SOURCE_KINDS: ReadonlySet<string> = new Set([
  "nurse_charted",
  "clinician_chart_action",
  "patient_statement",
  "admission_intake",
  "manual_lab_entry",
  "dictation_system",
]);

export const CLINICIAN_FAMILY_SOURCE_KINDS: ReadonlySet<string> = new Set([
  "nurse_charted",
  "clinician_chart_action",
  "manual_lab_entry",
  "dictation_system",
]);

export const CLINICIAN_FAMILY_AUTHOR_ROLES: ReadonlySet<string> = new Set([
  "rn",
  "lpn",
  "np",
  "pa",
  "md",
  "do",
  "hospitalist",
  "physician",
  "clinician",
  "resident",
  "fellow",
  "pharmacist",
  "rt",
  "therapist",
]);

// Import-family source.kind values per DESIGN §1.1.
// manual_scenario is fixture provenance, not machine import provenance.
export const IMPORT_SOURCE_KINDS: ReadonlySet<string> = new Set([
  "synthea_import",
  "mimic_iv_import",
]);

const DEVICE_SOURCE_KINDS: ReadonlySet<string> = new Set([
  "monitor_extension",
  "poc_device",
  "lab_analyzer",
  "lab_interface_hl7",
  "pacs_interface",
  "pathology_lis",
  "cardiology_reporting",
  "endoscopy_reporting",
  "protocol_standing_order",
]);

const IMPORT_AUTHORED_SOURCE_KINDS: ReadonlySet<string> = new Set([
  ...IMPORT_SOURCE_KINDS,
  "manual_scenario",
]);

type EventProjectionInput = {
  author?: {
    role?: unknown;
    on_behalf_of?: unknown;
  };
  source?: {
    kind?: unknown;
  };
};

export function deriveAuthorshipClass(event: EventProjectionInput): AuthorshipClass {
  const role = event.author?.role;
  const onBehalfOf = event.author?.on_behalf_of;
  const kind = event.source?.kind;

  if (onBehalfOf && isAgentRole(role)) return "agent-on-behalf-of-human";
  if (typeof kind !== "string") return "unknown";
  if (AGENT_REVIEWER_SOURCE_KINDS.has(kind)) return "agent-authored";
  if (HUMAN_REVIEWER_SOURCE_KINDS.has(kind)) return "human-authored";
  if (isDeviceSourceKind(kind)) return "device-authored";
  if (isImportSourceKind(kind)) return "imported";
  return "unknown";
}

export function actorFromChartSource(source: Source): { id: string; kind: string } {
  // Default chart-originated Claim actor mapping preserves the chart source
  // taxonomy. Callers that need ledger-family classes such as "device" can
  // pass an explicit actor at the clinical-truth contract boundary.
  return {
    id: source.ref ?? source.kind,
    kind: source.kind,
  };
}

export function isAgentReviewer(event: EventProjectionInput): boolean {
  const kind = typeof event.source?.kind === "string" ? event.source.kind : "";
  const role = event.author?.role;
  return AGENT_REVIEWER_SOURCE_KINDS.has(kind) || isAgentRole(role);
}

export function isHumanReviewer(event: EventProjectionInput): boolean {
  const kind = typeof event.source?.kind === "string" ? event.source.kind : "";
  return HUMAN_REVIEWER_SOURCE_KINDS.has(kind) && !isAgentReviewer(event);
}

export function isClinicianFamilyReviewer(event: EventProjectionInput): boolean {
  const kind = typeof event.source?.kind === "string" ? event.source.kind : "";
  const role = typeof event.author?.role === "string" ? event.author.role : "";
  return CLINICIAN_FAMILY_SOURCE_KINDS.has(kind) || CLINICIAN_FAMILY_AUTHOR_ROLES.has(role);
}

export function isAgentRole(role: unknown): boolean {
  return typeof role === "string" && (
    role === "agent" ||
    role === "rn_agent" ||
    role.endsWith("_agent")
  );
}

function isDeviceSourceKind(kind: string): boolean {
  return DEVICE_SOURCE_KINDS.has(kind);
}

function isImportSourceKind(kind: string): boolean {
  return IMPORT_AUTHORED_SOURCE_KINDS.has(kind);
}
