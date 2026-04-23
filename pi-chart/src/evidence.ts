// Evidence references. `links.supports[]` items may be bare strings
// (event id, note id, or a vitals:// URI — back-compat) or structured
// `EvidenceRef` objects (canonical form, see DESIGN §4.5). `parseEvidenceRef`
// normalizes either input into the canonical object shape defined in types.ts.

import type { EvidenceRef, EvidenceRole } from "./types.js";

const VITALS_PREFIX = "vitals://";
const NOTE_ID_PREFIX = "note_";
const EVENT_ID_PREFIX = "evt_";
const EVIDENCE_ROLES: ReadonlySet<EvidenceRole> = new Set([
  "primary",
  "context",
  "counterevidence",
  "trigger",
  "confirmatory",
]);

export type { EvidenceRef } from "./types.js";

export interface NormalizedEvidenceRef
  extends Omit<EvidenceRef, "kind" | "derived_from"> {
  kind: Exclude<EvidenceRef["kind"], "vitals">;
  derived_from?: NormalizedEvidenceRef[];
}

export interface ExpandedVitalsWindowRef {
  ref: string;
  metric: string;
  from: string;
  to: string;
  encounterId?: string;
}

/** Accepts a bare id string, a vitals:// URI, or a structured EvidenceRef. */
export function parseEvidenceRef(input: unknown): NormalizedEvidenceRef | null {
  if (typeof input === "object" && input !== null) {
    return normalizeEvidenceRefObject(input as Record<string, unknown>);
  }
  if (typeof input !== "string" || input.length === 0) return null;
  if (input.startsWith(VITALS_PREFIX)) return parseVitalsUri(input);
  if (input.startsWith(NOTE_ID_PREFIX)) return { kind: "note", ref: input };
  if (input.startsWith(EVENT_ID_PREFIX)) return { kind: "event", ref: input };
  // Structural ids (patient_*, enc_*, cst_*, etc.) stay as `event` refs —
  // validator resolves them against state.allIds.
  return { kind: "event", ref: input };
}

function normalizeEvidenceRefObject(
  ref: Record<string, unknown>,
): NormalizedEvidenceRef | null {
  const kind = typeof ref.kind === "string" ? ref.kind : null;
  if (!kind) return null;

  switch (kind) {
    case "event":
    case "note":
    case "artifact":
    case "external":
      return normalizeIdLikeRef(kind, ref);
    case "vitals_window":
    case "vitals":
      return normalizeVitalsLikeRef(kind, ref);
    default:
      return null;
  }
}

function normalizeIdLikeRef(
  kind: Extract<NormalizedEvidenceRef["kind"], "event" | "note" | "artifact" | "external">,
  ref: Record<string, unknown>,
): NormalizedEvidenceRef | null {
  const normalizedRef =
    typeof ref.ref === "string" && ref.ref.length > 0
      ? ref.ref
      : typeof ref.id === "string" && ref.id.length > 0
        ? ref.id
        : null;
  if (!normalizedRef) return null;

  const extras = normalizeOptionalFields(ref);
  if (!extras) return null;
  return { kind, ref: normalizedRef, ...extras };
}

function normalizeVitalsLikeRef(
  kind: "vitals_window" | "vitals",
  ref: Record<string, unknown>,
): NormalizedEvidenceRef | null {
  const legacySelection = legacyVitalsSelection(ref);
  const explicitRef =
    typeof ref.ref === "string" && ref.ref.length > 0 ? ref.ref : null;

  let normalizedRef = explicitRef;
  let normalizedSelection = normalizeSelection(ref.selection);

  if (legacySelection) {
    if (legacySelection.encounterId) {
      normalizedRef = formatVitalsUri({
        encounterId: legacySelection.encounterId,
        metric: legacySelection.metric,
        from: legacySelection.from,
        to: legacySelection.to,
      });
    } else {
      normalizedRef = formatEncounterlessVitalsUri(legacySelection);
    }
    normalizedSelection = {
      ...normalizedSelection,
      metric: legacySelection.metric,
      from: legacySelection.from,
      to: legacySelection.to,
      ...(legacySelection.encounterId
        ? { encounterId: legacySelection.encounterId }
        : {}),
    };
  }

  if (!normalizedRef) return null;
  const expanded = expandVitalsWindowRef({
    kind,
    ref: normalizedRef,
    ...(normalizedSelection ? { selection: normalizedSelection } : {}),
  });
  if (!expanded) return null;

  const extras = normalizeOptionalFields(ref);
  if (!extras) return null;
  return {
    kind: "vitals_window",
    ref: normalizedRef,
    ...extras,
    selection: {
      ...(extras.selection ?? {}),
      metric: expanded.metric,
      from: expanded.from,
      to: expanded.to,
      ...(expanded.encounterId ? { encounterId: expanded.encounterId } : {}),
    },
  };
}

function normalizeOptionalFields(
  ref: Record<string, unknown>,
): Omit<NormalizedEvidenceRef, "kind" | "ref"> | null {
  const out: Omit<NormalizedEvidenceRef, "kind" | "ref"> = {};

  if (typeof ref.role === "string" && EVIDENCE_ROLES.has(ref.role as EvidenceRole)) {
    out.role = ref.role as EvidenceRole;
  }
  if (typeof ref.basis === "string") out.basis = ref.basis;
  const selection = normalizeSelection(ref.selection);
  if (selection) out.selection = selection;

  if (ref.derived_from !== undefined) {
    if (!Array.isArray(ref.derived_from)) return null;
    const derivedFrom: NormalizedEvidenceRef[] = [];
    for (const item of ref.derived_from) {
      const normalized = parseEvidenceRef(item);
      if (!normalized) return null;
      derivedFrom.push(normalized);
    }
    out.derived_from = derivedFrom;
  }

  return out;
}

function normalizeSelection(
  selection: unknown,
): Record<string, unknown> | undefined {
  if (!selection || typeof selection !== "object" || Array.isArray(selection)) {
    return undefined;
  }
  return { ...(selection as Record<string, unknown>) };
}

function legacyVitalsSelection(
  ref: Record<string, unknown>,
): {
  metric: string;
  from: string;
  to: string;
  encounterId?: string;
} | null {
  const metric = typeof ref.metric === "string" ? ref.metric : null;
  const from = typeof ref.from === "string" ? ref.from : null;
  const to = typeof ref.to === "string" ? ref.to : null;
  const encounterId =
    typeof ref.encounterId === "string" && ref.encounterId.length > 0
      ? ref.encounterId
      : null;
  if (!metric || !from || !to) return null;
  if (Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) return null;
  return { metric, from, to, ...(encounterId ? { encounterId } : {}) };
}

function parseVitalsUri(s: string): NormalizedEvidenceRef | null {
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  const expanded = expandVitalsWindowFromUrl(url, s);
  if (!expanded) return null;
  return {
    kind: "vitals_window",
    ref: s,
    selection: {
      metric: expanded.metric,
      from: expanded.from,
      to: expanded.to,
      ...(expanded.encounterId ? { encounterId: expanded.encounterId } : {}),
    },
  };
}

export function formatVitalsUri(opts: {
  encounterId: string;
  metric?: string;
  name?: string;                     // legacy alias, accepted for back-compat
  from: Date | string;
  to: Date | string;
  unit?: string;
}): string {
  const metric = opts.metric ?? opts.name;
  if (!metric) throw new Error("formatVitalsUri: metric is required");
  const from = opts.from instanceof Date ? opts.from.toISOString() : opts.from;
  const to = opts.to instanceof Date ? opts.to.toISOString() : opts.to;
  const url = new URL(`vitals://${opts.encounterId}`);
  url.searchParams.set("name", metric);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  if (opts.unit) url.searchParams.set("unit", opts.unit);
  return url.toString();
}

function formatEncounterlessVitalsUri(opts: {
  metric: string;
  from: string;
  to: string;
}): string {
  const url = new URL("vitals://window");
  url.searchParams.set("name", opts.metric);
  url.searchParams.set("from", opts.from);
  url.searchParams.set("to", opts.to);
  return url.toString();
}

export function expandVitalsWindowRef(
  ref: Pick<EvidenceRef, "kind" | "ref" | "selection">,
): ExpandedVitalsWindowRef | null {
  if (ref.kind !== "vitals_window" && ref.kind !== "vitals") return null;

  const selection =
    ref.selection && typeof ref.selection === "object" && !Array.isArray(ref.selection)
      ? ref.selection
      : null;
  const metric = typeof selection?.metric === "string" ? selection.metric : null;
  const from = typeof selection?.from === "string" ? selection.from : null;
  const to = typeof selection?.to === "string" ? selection.to : null;
  const encounterId =
    typeof selection?.encounterId === "string" && selection.encounterId.length > 0
      ? selection.encounterId
      : null;

  if (metric && from && to && !Number.isNaN(Date.parse(from)) && !Number.isNaN(Date.parse(to))) {
    return {
      ref: ref.ref,
      metric,
      from,
      to,
      ...(encounterId ? { encounterId } : {}),
    };
  }

  let url: URL;
  try {
    url = new URL(ref.ref);
  } catch {
    return null;
  }
  return expandVitalsWindowFromUrl(url, ref.ref);
}

function expandVitalsWindowFromUrl(
  url: URL,
  rawRef: string,
): ExpandedVitalsWindowRef | null {
  const encounterId = url.host || url.pathname.replace(/^\//, "") || undefined;
  const metric = url.searchParams.get("name");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!encounterId || !metric || !from || !to) return null;
  if (Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) return null;
  return { ref: rawRef, metric, from, to, encounterId };
}

export function isVitalsUri(s: unknown): s is string {
  return typeof s === "string" && s.startsWith(VITALS_PREFIX);
}
