export type AttestationRole = "verify" | "cosign" | "countersign" | "witness" | "scribe";

export type AttestationState =
  | { kind: "none" }
  | { kind: "single"; role: AttestationRole; by: string; eventId: string; on_behalf_of?: string }
  | { kind: "chain"; roles: ReadonlyArray<{ role: AttestationRole; by: string; eventId: string }> };

type EventLike = {
  id?: unknown;
  ref?: unknown;
  type?: unknown;
  subtype?: unknown;
  profile?: unknown;
  recorded_at?: unknown;
  author?: { id?: unknown };
  data?: Record<string, unknown>;
  links?: Record<string, unknown>;
};

type AttestationMatch = {
  role: AttestationRole;
  by: string;
  eventId: string;
  on_behalf_of?: string;
  recordedAt: number;
  index: number;
};

const ATTESTATION_ROLES = new Set<AttestationRole>([
  "verify",
  "cosign",
  "countersign",
  "witness",
  "scribe",
]);

export function deriveAttestationState(
  targetEventId: string,
  allEvents: ReadonlyArray<unknown>,
): AttestationState {
  const matches = allEvents
    .map((event, index) => attestationMatch(event, targetEventId, index))
    .filter((match): match is AttestationMatch => match !== null)
    .sort((left, right) => left.recordedAt - right.recordedAt || left.index - right.index);

  if (matches.length === 0) return { kind: "none" };

  if (matches.length === 1) {
    const match = matches[0];
    return {
      kind: "single",
      role: match.role,
      by: match.by,
      eventId: match.eventId,
      on_behalf_of: match.on_behalf_of,
    };
  }

  return {
    kind: "chain",
    roles: matches.map((match) => ({
      role: match.role,
      by: match.by,
      eventId: match.eventId,
    })),
  };
}

function attestationMatch(
  value: unknown,
  targetEventId: string,
  index: number,
): AttestationMatch | null {
  if (!isEventLike(value)) return null;
  if (!isAttestationEvent(value)) return null;
  if (!attestationTargetRefs(value).includes(targetEventId)) return null;

  const role = value.data?.attestation_role;
  if (!isAttestationRole(role)) return null;

  const onBehalfOf = typeof value.data?.on_behalf_of === "string"
    ? value.data.on_behalf_of
    : undefined;
  if (role === "scribe" && !onBehalfOf) return null;

  return {
    role,
    by: typeof value.author?.id === "string" ? value.author.id : "unknown",
    eventId: typeof value.id === "string" ? value.id : "unknown",
    on_behalf_of: onBehalfOf,
    recordedAt: timestamp(value.recorded_at),
    index,
  };
}

function isEventLike(value: unknown): value is EventLike {
  return !!value && typeof value === "object";
}

function isAttestationEvent(event: EventLike): boolean {
  return (event.type === "communication" && event.subtype === "attestation") ||
    event.profile === "communication.attestation.v1";
}

function attestationTargetRefs(event: EventLike): string[] {
  return [
    ...stringValue(event.data?.attests_to),
    ...stringValue(event.data?.attestation_target),
    ...refsFromUnknown(event.links?.supports),
  ];
}

function isAttestationRole(value: unknown): value is AttestationRole {
  return typeof value === "string" && ATTESTATION_ROLES.has(value as AttestationRole);
}

function stringValue(value: unknown): string[] {
  return typeof value === "string" ? [value] : [];
}

function refsFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry === "string") return [entry];
    if (isEventLike(entry) && typeof entry.ref === "string") return [entry.ref];
    return [];
  });
}

function timestamp(value: unknown): number {
  if (typeof value !== "string") return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
