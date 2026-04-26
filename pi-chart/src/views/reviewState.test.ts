// HANDOFF: ADR17-17b claim review view characterization. Unblocks taxonomy ledger T03/T04/T05.
// Memo C1: review state is projection-derived; no schema change.
// Memo C4: review events do not mutate target.status.
// Validator contract markers consumed by 17V: V-REVIEW-01 V-REVIEW-02 V-REVIEW-03 V-REVIEW-04 V-REVIEW-05 V-REVIEW-06 V-REVIEW-07.

import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveReviewState, type ReviewState } from "./reviewState.js";

test("ADR17-17b: target with no reviews and agent-authored projects as suggested (rule 4, V-REVIEW-03)", () => {
  const target = { id: "evt_target", source: { kind: "agent_inference" }, author: { role: "agent" } };
  assert.equal(deriveReviewState("evt_target", [target]), "suggested");
});

test("ADR17-17b: target with no reviews and human-authored projects as none (rule 5)", () => {
  const target = { id: "evt_target", source: { kind: "nurse_charted" }, author: { role: "rn" } };
  assert.equal(deriveReviewState("evt_target", [target]), "none");
});

test("ADR17-17b: target with single accepted claim_review projects as accepted (rule 6, V-REVIEW-01, V-REVIEW-02)", () => {
  const target = { id: "evt_target", source: { kind: "agent_synthesis" }, author: { role: "agent" } };
  const review = {
    id: "evt_review",
    type: "action",
    subtype: "claim_review",
    profile: "action.claim_review.v1",
    source: { kind: "nurse_charted" },
    author: { role: "rn" },
    data: { review_decision: "verified", reviewed_refs: ["evt_target"] },
    links: { supports: [{ ref: "evt_target", kind: "event" }] },
  };
  assert.equal(deriveReviewState("evt_target", [target, review]), "accepted");
});

test("ADR17-17b: target with explicit verified basis projects as verified (V-REVIEW-05)", () => {
  const target = { id: "evt_target", source: { kind: "agent_synthesis" }, author: { role: "agent" } };
  const review = {
    id: "evt_review",
    type: "action",
    subtype: "claim_review",
    profile: "action.claim_review.v1",
    source: { kind: "nurse_charted" },
    author: { role: "rn" },
    data: { review_decision: "verified", reviewed_refs: ["evt_target"], review: { basis: "checked labs" } },
    links: { supports: [{ ref: "evt_target", kind: "event" }] },
  };
  assert.equal(deriveReviewState("evt_target", [target, review]), "verified");
});

test("ADR17-17b: target with single rejected claim_review projects as rejected (rule 6, V-REVIEW-04)", () => {
  const target = { id: "evt_target", source: { kind: "agent_inference" }, author: { role: "agent" } };
  const review = {
    id: "evt_review",
    type: "action",
    subtype: "claim_review",
    profile: "action.claim_review.v1",
    source: { kind: "nurse_charted" },
    author: { role: "rn" },
    data: { review_decision: "rejected", reviewed_refs: ["evt_target"], rationale: "evidence contradicts" },
    links: { contradicts: [{ ref: "evt_target", basis: "different focused exam" }] },
  };
  assert.equal(deriveReviewState("evt_target", [target, review]), "rejected");
});

test("ADR17-17b: target with co_signed claim_review projects as co_signed (V-REVIEW-06)", () => {
  const target = { id: "evt_target", source: { kind: "agent_inference" }, author: { role: "agent" } };
  const review = {
    id: "evt_review",
    type: "action",
    subtype: "claim_review",
    profile: "action.claim_review.v1",
    source: { kind: "clinician_chart_action" },
    author: { role: "md" },
    data: { review_decision: "co_signed", reviewed_refs: ["evt_target"] },
    links: { supports: [{ ref: "evt_target", kind: "event" }] },
  };
  assert.equal(deriveReviewState("evt_target", [target, review]), "co_signed");
});

test("ADR17-17b: target with links.supersedes from another event projects as superseded (rule 1)", () => {
  const target = { id: "evt_target", source: { kind: "nurse_charted" } };
  const replacement = { id: "evt_repl", source: { kind: "nurse_charted" }, links: { supersedes: ["evt_target"] } };
  assert.equal(deriveReviewState("evt_target", [target, replacement]), "superseded");
});

test("ADR17-17b: target with links.corrects from another event projects as entered_in_error (rule 2)", () => {
  const target = { id: "evt_target", source: { kind: "nurse_charted" } };
  const correction = { id: "evt_corr", source: { kind: "nurse_charted" }, links: { corrects: ["evt_target"] } };
  assert.equal(deriveReviewState("evt_target", [target, correction]), "entered_in_error");
});

test("ADR17-17b: target with two conflicting human reviews projects as contested (rule 8)", () => {
  const target = { id: "evt_target", source: { kind: "agent_inference" }, author: { role: "agent" } };
  const r1 = {
    id: "r1", type: "action", subtype: "claim_review", profile: "action.claim_review.v1",
    author: { role: "rn" }, source: { kind: "nurse_charted" },
    data: { review_decision: "verified", reviewed_refs: ["evt_target"] },
    links: { supports: [{ ref: "evt_target", kind: "event" }] },
    recorded_at: "2026-04-26T10:00:00Z",
  };
  const r2 = {
    id: "r2", type: "action", subtype: "claim_review", profile: "action.claim_review.v1",
    author: { role: "md" }, source: { kind: "clinician_chart_action" },
    data: { review_decision: "rejected", reviewed_refs: ["evt_target"] },
    links: { contradicts: [{ ref: "evt_target", basis: "differs" }] },
    recorded_at: "2026-04-26T10:05:00Z",
  };
  assert.equal(deriveReviewState("evt_target", [target, r1, r2]), "contested");
});

test("ADR17-17b: target with conflicting reviews + later resolver projects as resolver outcome (rule 9)", () => {
  const target = { id: "evt_target", source: { kind: "agent_inference" }, author: { role: "agent" } };
  const r1 = { id: "r1", type: "action", subtype: "claim_review", profile: "action.claim_review.v1",
    author: { role: "rn" }, source: { kind: "nurse_charted" },
    data: { review_decision: "verified", reviewed_refs: ["evt_target"] },
    links: { supports: [{ ref: "evt_target", kind: "event" }] },
    recorded_at: "2026-04-26T10:00:00Z" };
  const r2 = { id: "r2", type: "action", subtype: "claim_review", profile: "action.claim_review.v1",
    author: { role: "md" }, source: { kind: "clinician_chart_action" },
    data: { review_decision: "rejected", reviewed_refs: ["evt_target"] },
    links: { contradicts: [{ ref: "evt_target", basis: "differs" }] },
    recorded_at: "2026-04-26T10:05:00Z" };
  const resolver = { id: "r3", type: "action", subtype: "claim_review", profile: "action.claim_review.v1",
    author: { role: "md" }, source: { kind: "clinician_chart_action" },
    data: { review_decision: "verified", reviewed_refs: ["evt_target"], rationale: "resolved on rounds" },
    links: { supports: [{ ref: "evt_target", kind: "event" }, { ref: "r1", kind: "event" }, { ref: "r2", kind: "event" }] },
    recorded_at: "2026-04-26T10:30:00Z" };
  assert.equal(deriveReviewState("evt_target", [target, r1, r2, resolver]), "accepted");
});

test("ADR17-17b: claim_review status_detail remains a validator concern (V-REVIEW-07)", () => {
  const target = { id: "evt_target", source: { kind: "agent_inference" }, author: { role: "agent" } };
  const review = { id: "evt_review", type: "action", subtype: "claim_review", profile: "action.claim_review.v1",
    author: { role: "rn" }, source: { kind: "nurse_charted" },
    data: { review_decision: "accepted", reviewed_refs: ["evt_target"], status_detail: "accepted" } };
  assert.equal(deriveReviewState("evt_target", [target, review]), "accepted");
});

test("ADR17-17b: brownfield action:result_review subtype links to target and projects acknowledged as accepted", () => {
  const target = { id: "evt_lab", type: "observation", subtype: "lab_result", source: { kind: "lab_analyzer" }, author: { role: "system" } };
  const review = {
    id: "evt_review", type: "action", subtype: "result_review",
    author: { role: "rn" }, source: { kind: "nurse_charted" },
    data: { status_detail: "acknowledged", reviewed_refs: ["evt_lab"] },
    links: { supports: [{ ref: "evt_lab", kind: "event" }] },
  };
  const result: ReviewState = deriveReviewState("evt_lab", [target, review]);
  assert.equal(result, "accepted");
});

test("ADR17-17b: empty allEvents returns none", () => {
  assert.equal(deriveReviewState("evt_anything", []), "none");
});

test("ADR17-17b: targetEventId not in allEvents returns none", () => {
  const someone = { id: "evt_other", source: { kind: "nurse_charted" } };
  assert.equal(deriveReviewState("evt_missing", [someone]), "none");
});

test("ADR17-17b: deriveReviewState does not mutate inputs", () => {
  const target = { id: "evt_target", source: { kind: "agent_inference" }, author: { role: "agent" } };
  const review = { id: "evt_review", type: "action", subtype: "claim_review", profile: "action.claim_review.v1",
    author: { role: "rn" }, source: { kind: "nurse_charted" },
    data: { review_decision: "verified", reviewed_refs: ["evt_target"] },
    links: { supports: [{ ref: "evt_target", kind: "event" }] } };
  const targetSnapshot = JSON.stringify(target);
  const reviewSnapshot = JSON.stringify(review);
  deriveReviewState("evt_target", [target, review]);
  assert.equal(JSON.stringify(target), targetSnapshot);
  assert.equal(JSON.stringify(review), reviewSnapshot);
});
