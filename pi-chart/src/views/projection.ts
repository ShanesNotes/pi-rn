export type AuthorshipClass =
  | "human-authored"
  | "agent-authored"
  | "agent-on-behalf-of-human"
  | "device-authored"
  | "imported"
  | "unknown";

const AGENT_KINDS: ReadonlySet<string> = new Set([
  "agent_inference",
  "agent_synthesis",
  "agent_bedside_observation",
  "agent_action",
  "agent_review",
  "agent_reasoning",
]);

const HUMAN_KINDS: ReadonlySet<string> = new Set([
  "nurse_charted",
  "clinician_chart_action",
  "patient_statement",
  "admission_intake",
  "manual_lab_entry",
  "dictation_system",
]);

const DEVICE_KINDS: ReadonlySet<string> = new Set([
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

const IMPORT_KINDS: ReadonlySet<string> = new Set([
  "synthea_import",
  "mimic_iv_import",
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
  if (AGENT_KINDS.has(kind)) return "agent-authored";
  if (HUMAN_KINDS.has(kind)) return "human-authored";
  if (DEVICE_KINDS.has(kind)) return "device-authored";
  if (IMPORT_KINDS.has(kind)) return "imported";
  return "unknown";
}

function isAgentRole(role: unknown): boolean {
  return typeof role === "string" && (
    role === "agent" ||
    role === "rn_agent" ||
    role.endsWith("_agent")
  );
}
