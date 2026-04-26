import { deriveAuthorshipClass } from "./projection.js";

export type ReviewState =
  | "none"
  | "suggested"
  | "accepted"
  | "verified"
  | "rejected"
  | "co_signed"
  | "superseded"
  | "entered_in_error"
  | "contested";

type EventLike = {
  id?: unknown;
  ref?: unknown;
  type?: unknown;
  subtype?: unknown;
  profile?: unknown;
  recorded_at?: unknown;
  author?: { role?: unknown; on_behalf_of?: unknown };
  source?: { kind?: unknown };
  data?: Record<string, unknown>;
  links?: Record<string, unknown>;
};

type ReviewMatch = {
  event: EventLike;
  state: ReviewState;
  index: number;
};

const BROWNFIELD_REVIEW_SUBTYPES = new Set([
  "result_review",
  "constraint_review",
  "problem_review",
]);

const REVIEW_STATES = new Set<ReviewState>([
  "accepted",
  "verified",
  "rejected",
  "co_signed",
]);

export function deriveReviewState(
  targetEventId: string,
  allEvents: ReadonlyArray<unknown>,
): ReviewState {
  const events = allEvents.filter(isEventLike);
  const target = events.find((event) => event.id === targetEventId);
  if (!target) return "none";

  if (hasIncomingTargetRef(events, targetEventId, "supersedes")) return "superseded";
  if (hasIncomingTargetRef(events, targetEventId, "corrects")) return "entered_in_error";

  const reviews = events
    .map((event, index): ReviewMatch | null => {
      if (!isReviewEventForTarget(event, targetEventId)) return null;
      if (deriveAuthorshipClass(event) !== "human-authored") return null;
      const state = reviewEventState(event);
      return state ? { event, state, index } : null;
    })
    .filter((review): review is ReviewMatch => review !== null)
    .sort(compareReviewMatches);

  if (reviews.length === 0) {
    return deriveAuthorshipClass(target) === "agent-authored" ? "suggested" : "none";
  }

  const outcomes = new Set(reviews.map((review) => review.state));
  if (outcomes.size === 1) return reviews[reviews.length - 1]?.state ?? "none";

  const latest = reviews[reviews.length - 1];
  const earlierReviewIds = new Set(
    reviews
      .slice(0, -1)
      .map((review) => review.event.id)
      .filter((id): id is string => typeof id === "string"),
  );
  if (latest && referencesAny(latest.event, earlierReviewIds)) return latest.state;

  return "contested";
}

function isEventLike(value: unknown): value is EventLike {
  return !!value && typeof value === "object";
}

function hasIncomingTargetRef(
  events: ReadonlyArray<EventLike>,
  targetEventId: string,
  linkName: "supersedes" | "corrects",
): boolean {
  return events.some((event) => {
    if (event.id === targetEventId) return false;
    return refsFromUnknown(event.links?.[linkName]).includes(targetEventId);
  });
}

function isReviewEventForTarget(event: EventLike, targetEventId: string): boolean {
  const subtype = typeof event.subtype === "string" ? event.subtype : "";
  const profile = typeof event.profile === "string" ? event.profile : "";
  const isClaimReview = event.type === "action" && subtype === "claim_review";
  const isBrownfieldReview = event.type === "action" && BROWNFIELD_REVIEW_SUBTYPES.has(subtype);
  const isProfileConfirmation = profile === "action.claim_review.v1";

  if (!isClaimReview && !isBrownfieldReview && !isProfileConfirmation) return false;

  return eventTargetRefs(event).includes(targetEventId);
}

function eventTargetRefs(event: EventLike): string[] {
  return [
    ...refsFromUnknown(event.data?.reviewed_refs),
    ...refsFromUnknown(event.links?.supports),
    ...refsFromUnknown(event.links?.contradicts),
  ];
}

function reviewEventState(event: EventLike): ReviewState | null {
  const decision = firstString(
    event.data?.review_decision,
    nested(event.data?.review, "outcome"),
    event.data?.outcome,
  );

  if (decision === "verified") return hasCheckedEvidenceBasis(event) ? "verified" : "accepted";
  if (decision === "accepted") return "accepted";
  if (decision === "rejected") return "rejected";
  if (decision === "co_signed") return "co_signed";

  const statusDetail = event.data?.status_detail;
  if (statusDetail === "acknowledged" || statusDetail === "reviewed" || statusDetail === "updated") {
    return "accepted";
  }
  if (statusDetail === "unable_to_verify") return "rejected";

  return REVIEW_STATES.has(decision as ReviewState) ? (decision as ReviewState) : null;
}

function hasCheckedEvidenceBasis(event: EventLike): boolean {
  return !!firstString(
    nested(event.data?.review, "basis"),
    event.data?.basis,
  );
}

function compareReviewMatches(left: ReviewMatch, right: ReviewMatch): number {
  const leftTime = timestamp(left.event.recorded_at);
  const rightTime = timestamp(right.event.recorded_at);
  if (leftTime !== rightTime) return leftTime - rightTime;
  return left.index - right.index;
}

function timestamp(value: unknown): number {
  if (typeof value !== "string") return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function referencesAny(event: EventLike, targetIds: ReadonlySet<string>): boolean {
  if (targetIds.size === 0) return false;
  const refs = [
    ...refsFromUnknown(event.links?.supports),
    ...refsFromUnknown(event.links?.contradicts),
    ...refsFromUnknown(event.links?.resolves),
    ...refsFromUnknown(event.data?.reviewed_refs),
  ];
  return refs.some((ref) => targetIds.has(ref));
}

function refsFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry === "string") return [entry];
    if (isEventLike(entry) && typeof entry.ref === "string") return [entry.ref];
    return [];
  });
}

function nested(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object") return undefined;
  return (value as Record<string, unknown>)[key];
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string") return value;
  }
  return null;
}
