Status: agent-to-agent handoff. Three lanes (two parallel-safe view lanes + one deferred integration lane). Builds on 17a + V03-S4 foundations already landed.
Origin: HITL split disposition recorded 2026-04-25; 17a actor classification + V03-S4 profile registry foundation merged 2026-04-25 (commits cab33a1 + 50c6783). Next-lane handoff drafted 2026-04-26.

# Handoff — ADR17-17b claim review view · ADR17-17c attestation view · ADR17-17V validator/schema integration

## Mission

Three lanes. PHA-pattern isolation:

- **Lane 17b-VIEW** characterizes review-state derivation for `action.claim_review.v1` events. View layer only. Emits failing tests that 17V consumes.
- **Lane 17c-VIEW** characterizes attestation-state derivation for `communication.attestation.v1` events. View layer only. Emits failing tests that 17V consumes.
- **Lane 17V-INTEGRATION** lands the shared writes: profile registry append, validator rules `V-REVIEW-01..07` + `V-ATTEST-01..04`, and any `STATUS_RULES` extensions. Consumes failing tests from 17b-VIEW and 17c-VIEW.

The pattern mirrors PHA-001 exactly. PHA-TB-2/PHA-TB-3 are view-layer characterization lanes that emitted failing tests; PHA-TB-V was the single integration lane that landed shared validator + schema edits. ADR17 follows the same DAG: view lanes parallel, integration lane sequential after at least one view lane lands a failing test.

## Foundations already landed (do not reimplement)

- `src/views/projection.ts` — `deriveAuthorshipClass` (Lane 17a, commit cab33a1). Closed-set discrimination by `source.kind` + `author.role` + `author.on_behalf_of`. Pure function. Six-value `AuthorshipClass` union.
- `schemas/event.schema.json` — optional `profile` string field added (V03-S4, commit 50c6783).
- `schemas/profiles/index.json` — empty registry `{"version": 1, "profiles": []}` (V03-S4, commit 50c6783).
- `src/validate.ts` — `PROFILE_REGISTRY` IIFE + `V-PROFILE-01` validator rule wired into both `validateStructuralMarkdown` and `validateTimeline` paths (V03-S4).
- 17b/17c view lanes BUILD ON these. They MUST NOT reimplement `deriveAuthorshipClass` or duplicate profile-registry logic.

## Disjoint ownership matrix

| File | 17b-VIEW | 17c-VIEW | 17V-INTEGRATION |
|---|---|---|---|
| `src/views/reviewState.ts` (NEW) | OWNS | NOT touched | NOT touched |
| `src/views/reviewState.test.ts` (NEW) | OWNS | NOT touched | NOT touched |
| `src/views/attestationState.ts` (NEW) | NOT touched | OWNS | NOT touched |
| `src/views/attestationState.test.ts` (NEW) | NOT touched | OWNS | NOT touched |
| `schemas/profiles/index.json` | NOT touched | NOT touched | OWNS (append `action.claim_review.v1` AND `communication.attestation.v1`) |
| `src/validate.ts` | NOT touched | NOT touched | OWNS (add `V-REVIEW-01..07`, `V-ATTEST-01..04`, optional STATUS_RULES extension) |
| `src/validate.test.ts` | NOT touched | NOT touched | OWNS |
| `src/views/projection.ts` (existing) | NOT touched | NOT touched | NOT touched |
| `decisions/` | NOT touched | NOT touched | NOT touched |
| `docs/plans/` | NOT touched | NOT touched | NOT touched |
| `patients/**` fixtures | append-only with `adr17b-` prefix | append-only with `adr17c-` prefix | append-only with `adr17v-` prefix if test fixtures needed |

Disjoint guarantee: 17b-VIEW and 17c-VIEW share zero write targets. 17V-INTEGRATION shares zero write targets with either view lane.

Cross-lane verification: after each lane commits, `git diff --name-only` should match exactly the OWNS row for that lane.

## Hard-gate DAG

```
17b-VIEW (review-state derivation; emits failing test)         17c-VIEW (attestation-state derivation; emits failing test)
        │                                                                  │
        │                  PARALLEL-SAFE (disjoint owned files)            │
        │                                                                  │
        └──────────────────────────────┬───────────────────────────────────┘
                                       ▼
                        17V-INTEGRATION (HARD GATE: at least one of
                        17b-VIEW or 17c-VIEW must have committed
                        failing tests before 17V-INTEGRATION runs)
                                       │
                                       ▼
                        Acceptance lane: kanban row update + ADR17 PRD
                        moves from "split disposition staged" to
                        "split-implementation in progress"; HITL signs.
```

Hard-gate semantics: 17V-INTEGRATION may NOT run before at least one view lane has committed at least one failing test that names a `V-REVIEW-*` or `V-ATTEST-*` rule. The failing test is the literal handoff contract: 17V consumes it RED-then-GREEN per TDD.

---

## Lane 17b-VIEW: claim review state characterization

### Source authority

- `memos/Actor-attestation-taxonomy.md` lines 217-261 (`ReviewState` and `MemoryProofEventMeta` shapes; projection rules 1-5).
- `memos/Actor-attestation-taxonomy.md` lines 619-629 (8-rule deterministic accountable-actor priority).
- `decisions/017-actor-attestation-review-taxonomy.md` lines 75-111 (proposed-not-canonical: `action.claim_review.v1` profile shape + decision semantics).
- ADR17-001 PRD taxonomy ledger rows T03 (`accepted`), T04 (`verified`), T05 (`rejected`).
- `src/views/projection.ts` (already-landed; reuse `deriveAuthorshipClass` if helpful, do NOT reimplement).

### Brownfield evidence (read before editing)

```bash
ls src/views/reviewState.ts 2>&1 || echo "no review-state helper yet"
grep -RIn "deriveReviewState\|review_state\|ReviewState" src/views || echo "no review-state code"
grep -n "result_review\|constraint_review\|problem_review" src/validate.ts | head -10
```

Expected: no `reviewState.ts`; existing `STATUS_RULES["action:result_review|constraint_review|problem_review"]` already in `src/validate.ts:199-224` — these are the brownfield review subtypes that pre-date ADR17.

### Goal

Create `src/views/reviewState.ts` exporting `deriveReviewState(targetEventId, allEvents)` that returns a `ReviewState` value derived from review events linked to the target. View layer only. NO validator rule. NO schema change. NO profile registry edit.

```ts
export type ReviewState =
  | "none"           // no review events found
  | "suggested"      // agent-authored target with no human review
  | "accepted"       // latest human review.outcome === "accepted" or review_decision === "verified"
  | "verified"       // latest human review with checked-evidence basis
  | "rejected"       // latest human review.outcome === "rejected" or review_decision === "rejected"
  | "co_signed"      // latest review event has cosign role/outcome
  | "superseded"     // target has links.supersedes from another event
  | "entered_in_error" // target has links.corrects from another event
  | "contested";     // multiple conflicting human reviews with no resolver
```

Derivation rules (memo lines 254-260):

1. If target has `links.supersedes` from another event → `superseded`.
2. Else if target has `links.corrects` from another event → `entered_in_error`.
3. Else find all `action.claim_review.v1` events (subtype `claim_review`) AND existing brownfield review subtypes (`action:result_review`, `action:constraint_review`, `action:problem_review`) whose `links.supports[*].ref` OR `data.reviewed_refs[*]` matches `targetEventId`.
4. If no review events AND target was authored by an agent (use `deriveAuthorshipClass(target) === "agent-authored"`) → `suggested`.
5. If no review events AND target was human-authored → `none`.
6. If exactly one human review event → that event's outcome (one of `accepted` / `verified` / `rejected` / `co_signed`).
7. If multiple human reviews with same outcome → that outcome.
8. If multiple human reviews with conflicting outcomes AND no later resolving review → `contested`.
9. If multiple human reviews with conflicting outcomes AND a later resolving review → that resolver's outcome.

The function MUST be pure: no mutation, no IO, no global state. It reads `allEvents` array and the `targetEventId` string.

### Owned files

1. `src/views/reviewState.ts` (NEW): exports `ReviewState` type and `deriveReviewState` function. Imports `deriveAuthorshipClass` from `./projection.js`.
2. `src/views/reviewState.test.ts` (NEW): 9-rule coverage tests (one per derivation rule above) + at least 3 edge-case tests (empty allEvents, target not in allEvents, brownfield review subtype linking).

### First failing tests (write these BEFORE implementation)

```ts
// src/views/reviewState.test.ts
// HANDOFF: ADR17-17b claim review view characterization. Unblocks taxonomy ledger T03/T04/T05.
// Memo C1: review state is projection-derived; no schema change.
// Memo C4: review events do not mutate target.status.
// Output: failing tests that ADR17-17V validator integration consumes.

import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveReviewState, type ReviewState } from "./reviewState.js";

test("ADR17-17b: target with no reviews and agent-authored projects as suggested (rule 4)", () => {
  const target = { id: "evt_target", source: { kind: "agent_inference" }, author: { role: "agent" } };
  assert.equal(deriveReviewState("evt_target", [target]), "suggested");
});

test("ADR17-17b: target with no reviews and human-authored projects as none (rule 5)", () => {
  const target = { id: "evt_target", source: { kind: "nurse_charted" }, author: { role: "rn" } };
  assert.equal(deriveReviewState("evt_target", [target]), "none");
});

test("ADR17-17b: target with single accepted claim_review projects as accepted (rule 6)", () => {
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

test("ADR17-17b: target with single rejected claim_review projects as rejected (rule 6)", () => {
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

test("ADR17-17b: brownfield action:result_review subtype links to target and projects accepted/rejected", () => {
  const target = { id: "evt_lab", type: "observation", subtype: "lab_result", source: { kind: "lab_analyzer" }, author: { role: "system" } };
  const review = {
    id: "evt_review", type: "action", subtype: "result_review",
    author: { role: "rn" }, source: { kind: "nurse_charted" },
    data: { status_detail: "acknowledged", reviewed_refs: ["evt_lab"] },
    links: { supports: [{ ref: "evt_lab", kind: "event" }] },
  };
  // Brownfield review subtypes use status_detail or data.review.outcome to express disposition.
  // Implementation MAY treat status_detail "acknowledged" as accepted; document the choice.
  const result = deriveReviewState("evt_lab", [target, review]);
  assert.ok(result === "accepted" || result === "none",
    "brownfield result_review handling: either map acknowledged→accepted, or stay none until a claim_review event exists");
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
```

### Acceptance criteria

1. `src/views/reviewState.ts` exports `ReviewState` union type with exactly 9 string-literal members and `deriveReviewState(targetEventId: string, allEvents: ReadonlyArray<unknown>): ReviewState`.
2. `src/views/reviewState.test.ts` contains all 11 tests above with literal test names.
3. All 11 tests pass under `node --test --import tsx src/views/reviewState.test.ts`.
4. `npm test` passes with no regressions. `npm run typecheck` passes.
5. `git diff --name-only` shows ONLY `src/views/reviewState.ts` and `src/views/reviewState.test.ts`.
6. `deriveReviewState` MUST NOT read `event.profile` field for required behavior — match by `subtype` for backward compatibility with brownfield review subtypes; if `profile` is set use it as additional confirmation only.
7. `deriveReviewState` MUST NOT mutate any input.
8. `deriveReviewState` MUST NOT do IO. No filesystem access. No fetch.

### Verification command

```bash
node --test --import tsx src/views/reviewState.test.ts 2>&1 | tail -20
echo "---"
npm test 2>&1 > /tmp/full-test.log
tail -12 /tmp/full-test.log
echo "---"
git diff --name-only | sort
echo "---"
git diff --name-only -- schemas/ src/validate.ts src/validate.test.ts src/views/attestationState.ts src/views/projection.ts | head -1 | grep -q . && echo "FAIL: 17b-VIEW touched another lane's territory" || echo "OK: 17b-VIEW disjoint"
```

### Stop boundaries

- DO NOT add `V-REVIEW-*` validator rules. 17V owns those.
- DO NOT register `action.claim_review.v1` in the profile registry. 17V owns that.
- DO NOT extend `STATUS_RULES["action:claim_review"]`. 17V owns that.
- DO NOT touch `src/views/projection.ts` (17a's owned file).
- DO NOT touch `src/views/attestationState.ts` (17c's owned file).
- DO NOT touch `decisions/`, `docs/plans/`, `package.json`, lockfiles.

---

## Lane 17c-VIEW: professional attestation state characterization

### Source authority

- `memos/Actor-attestation-taxonomy.md` lines 503-547 (co-signed note/result review fixture, scope of cosign accountability).
- `decisions/017-actor-attestation-review-taxonomy.md` lines 113-153 (proposed-not-canonical: `communication.attestation.v1` profile shape + 5 attestation roles `verify` / `cosign` / `countersign` / `witness` / `scribe`).
- ADR17-001 PRD taxonomy ledger row T06 (`co-signed`).
- `src/views/projection.ts` (use `deriveAuthorshipClass` if helpful; do NOT reimplement).

### Brownfield evidence

```bash
ls src/views/attestationState.ts 2>&1 || echo "no attestation-state helper yet"
grep -RIn "deriveAttestationState\|attestation_state\|AttestationState" src/views || echo "no attestation code"
grep -n "communication" src/validate.ts | head -10
```

Expected: no attestation helper; communication subtype is open in schema (no enum restriction); `STATUS_RULES["communication:*"]` already exists at `src/validate.ts:249-258`.

### Goal

Create `src/views/attestationState.ts` exporting `deriveAttestationState(targetEventId, allEvents)` that returns the latest `AttestationState` for a target. Five attestation roles plus none/multi states.

```ts
export type AttestationRole = "verify" | "cosign" | "countersign" | "witness" | "scribe";

export type AttestationState =
  | { kind: "none" }
  | { kind: "single"; role: AttestationRole; by: string; eventId: string; on_behalf_of?: string }
  | { kind: "chain"; roles: ReadonlyArray<{ role: AttestationRole; by: string; eventId: string }> };
```

Derivation rules (decisions/017 lines 143-152 + memo lines 503-547):

1. Find all `communication.attestation.v1` events (subtype `attestation`) whose `data.attests_to` OR `data.attestation_target` OR `links.supports[*].ref` matches `targetEventId`.
2. If none → `{ kind: "none" }`.
3. If exactly one → `{ kind: "single", role: data.attestation_role, by: author.id, eventId, on_behalf_of: data.on_behalf_of }`.
4. If multiple → `{ kind: "chain", roles: [{ role, by, eventId } for each, ordered by recorded_at] }`.
5. Validate `role` is one of the 5 known roles; if not, project as `{ kind: "none" }` (defensive; `V-ATTEST-*` from 17V is the strict enforcement).
6. `scribe` role MUST have `data.on_behalf_of`; if missing, project as `{ kind: "none" }`.

Pure function. No mutation. No IO.

### Owned files

1. `src/views/attestationState.ts` (NEW): exports `AttestationRole`, `AttestationState`, `deriveAttestationState`.
2. `src/views/attestationState.test.ts` (NEW): one test per derivation rule + 3 edge cases.

### First failing tests

```ts
// src/views/attestationState.test.ts
// HANDOFF: ADR17-17c attestation view characterization. Unblocks taxonomy ledger T06.
// ADR 017 lines 113-153 (proposed-not-canonical): communication.attestation.v1 profile.
// Output: failing tests that ADR17-17V validator integration consumes for V-ATTEST-01..04.

import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveAttestationState, type AttestationState } from "./attestationState.js";

test("ADR17-17c: target with no attestation events projects as none (rule 2)", () => {
  const target = { id: "evt_target", source: { kind: "agent_synthesis" } };
  const result = deriveAttestationState("evt_target", [target]);
  assert.deepEqual(result, { kind: "none" });
});

test("ADR17-17c: target with single cosign attestation projects as single (rule 3) — T06", () => {
  const target = { id: "evt_target", source: { kind: "agent_synthesis" } };
  const att = {
    id: "evt_cosign",
    type: "communication",
    subtype: "attestation",
    profile: "communication.attestation.v1",
    source: { kind: "clinician_chart_action" },
    author: { id: "md_lee", role: "md" },
    data: { attests_to: "evt_target", attestation_role: "cosign" },
    links: { supports: [{ ref: "evt_target", kind: "event" }] },
    recorded_at: "2026-04-26T11:00:00Z",
  };
  const result = deriveAttestationState("evt_target", [target, att]);
  assert.deepEqual(result, { kind: "single", role: "cosign", by: "md_lee", eventId: "evt_cosign", on_behalf_of: undefined });
});

test("ADR17-17c: target with multiple attestations projects as chain ordered by recorded_at (rule 4)", () => {
  const target = { id: "evt_target", source: { kind: "agent_synthesis" } };
  const a1 = { id: "a1", type: "communication", subtype: "attestation", profile: "communication.attestation.v1",
    author: { id: "rn_amy", role: "rn" }, source: { kind: "nurse_charted" },
    data: { attests_to: "evt_target", attestation_role: "verify" },
    recorded_at: "2026-04-26T11:00:00Z" };
  const a2 = { id: "a2", type: "communication", subtype: "attestation", profile: "communication.attestation.v1",
    author: { id: "md_lee", role: "md" }, source: { kind: "clinician_chart_action" },
    data: { attests_to: "evt_target", attestation_role: "cosign" },
    recorded_at: "2026-04-26T11:30:00Z" };
  const result = deriveAttestationState("evt_target", [target, a1, a2]);
  assert.equal(result.kind, "chain");
  if (result.kind === "chain") {
    assert.equal(result.roles.length, 2);
    assert.deepEqual(result.roles[0], { role: "verify", by: "rn_amy", eventId: "a1" });
    assert.deepEqual(result.roles[1], { role: "cosign", by: "md_lee", eventId: "a2" });
  }
});

test("ADR17-17c: scribe role without on_behalf_of projects as none (rule 6)", () => {
  const target = { id: "evt_target", source: { kind: "nurse_charted" } };
  const att = { id: "a1", type: "communication", subtype: "attestation", profile: "communication.attestation.v1",
    author: { id: "rn_amy", role: "rn" }, source: { kind: "nurse_charted" },
    data: { attests_to: "evt_target", attestation_role: "scribe" /* no on_behalf_of */ },
    recorded_at: "2026-04-26T11:00:00Z" };
  const result = deriveAttestationState("evt_target", [target, att]);
  assert.deepEqual(result, { kind: "none" });
});

test("ADR17-17c: scribe role with on_behalf_of projects as single (rule 3 + 6)", () => {
  const target = { id: "evt_target", source: { kind: "nurse_charted" } };
  const att = { id: "a1", type: "communication", subtype: "attestation", profile: "communication.attestation.v1",
    author: { id: "rn_amy", role: "rn" }, source: { kind: "nurse_charted" },
    data: { attests_to: "evt_target", attestation_role: "scribe", on_behalf_of: "rn_pat" },
    recorded_at: "2026-04-26T11:00:00Z" };
  const result = deriveAttestationState("evt_target", [target, att]);
  assert.deepEqual(result, { kind: "single", role: "scribe", by: "rn_amy", eventId: "a1", on_behalf_of: "rn_pat" });
});

test("ADR17-17c: unknown attestation_role is rejected (rule 5)", () => {
  const target = { id: "evt_target", source: { kind: "nurse_charted" } };
  const att = { id: "a1", type: "communication", subtype: "attestation", profile: "communication.attestation.v1",
    author: { id: "rn_amy", role: "rn" }, source: { kind: "nurse_charted" },
    data: { attests_to: "evt_target", attestation_role: "made_up_role" },
    recorded_at: "2026-04-26T11:00:00Z" };
  const result = deriveAttestationState("evt_target", [target, att]);
  assert.deepEqual(result, { kind: "none" });
});

test("ADR17-17c: attestation linked via links.supports also matches target (rule 1)", () => {
  const target = { id: "evt_target", source: { kind: "agent_synthesis" } };
  const att = { id: "a1", type: "communication", subtype: "attestation", profile: "communication.attestation.v1",
    author: { id: "md_lee", role: "md" }, source: { kind: "clinician_chart_action" },
    data: { attestation_role: "verify" /* no attests_to; only links */ },
    links: { supports: [{ ref: "evt_target", kind: "event" }] },
    recorded_at: "2026-04-26T11:00:00Z" };
  const result = deriveAttestationState("evt_target", [target, att]);
  assert.equal(result.kind, "single");
});

test("ADR17-17c: empty allEvents returns none", () => {
  const result = deriveAttestationState("evt_x", []);
  assert.deepEqual(result, { kind: "none" });
});

test("ADR17-17c: deriveAttestationState does not mutate inputs", () => {
  const target = { id: "evt_target", source: { kind: "agent_synthesis" } };
  const att = { id: "a1", type: "communication", subtype: "attestation", profile: "communication.attestation.v1",
    author: { id: "md_lee", role: "md" }, source: { kind: "clinician_chart_action" },
    data: { attests_to: "evt_target", attestation_role: "cosign" },
    recorded_at: "2026-04-26T11:00:00Z" };
  const targetSnap = JSON.stringify(target);
  const attSnap = JSON.stringify(att);
  deriveAttestationState("evt_target", [target, att]);
  assert.equal(JSON.stringify(target), targetSnap);
  assert.equal(JSON.stringify(att), attSnap);
});
```

### Acceptance criteria

1. `src/views/attestationState.ts` exports `AttestationRole` union (5 members), `AttestationState` discriminated union, and `deriveAttestationState`.
2. `src/views/attestationState.test.ts` contains all 9 tests above with literal names.
3. All 9 tests pass.
4. `npm test` passes; `npm run typecheck` passes.
5. `git diff --name-only` shows ONLY `src/views/attestationState.ts` and `src/views/attestationState.test.ts`.
6. `deriveAttestationState` MUST NOT mutate inputs and MUST NOT do IO.
7. Defensive role validation per rule 5/6: unknown roles or scribe-without-on_behalf_of project as `none`.

### Verification command

```bash
node --test --import tsx src/views/attestationState.test.ts 2>&1 | tail -20
echo "---"
npm test 2>&1 > /tmp/full-test.log
tail -12 /tmp/full-test.log
echo "---"
git diff --name-only | sort
echo "---"
git diff --name-only -- schemas/ src/validate.ts src/validate.test.ts src/views/reviewState.ts src/views/projection.ts | head -1 | grep -q . && echo "FAIL: 17c-VIEW touched another lane's territory" || echo "OK: 17c-VIEW disjoint"
```

### Stop boundaries

- DO NOT add `V-ATTEST-*` validator rules. 17V owns those.
- DO NOT register `communication.attestation.v1` in the profile registry. 17V owns that.
- DO NOT touch `src/views/projection.ts`, `src/views/reviewState.ts`. Other lanes' files.
- DO NOT touch `decisions/`, `docs/plans/`, `package.json`, lockfiles.

---

## Lane 17V-INTEGRATION (HARD GATE: at least one view lane committed first)

### Hard-gate precondition

Before 17V-INTEGRATION starts, the executing agent MUST verify:

```bash
# At least one of these files exists with passing failing-test contracts that name V-REVIEW or V-ATTEST rules
test -f src/views/reviewState.ts || echo "17b-VIEW not committed"
test -f src/views/attestationState.ts || echo "17c-VIEW not committed"

# At least one view test file mentions a V-REVIEW-* or V-ATTEST-* rule that THIS lane will land
grep -E "V-REVIEW-0[1-7]|V-ATTEST-0[1-4]" src/views/reviewState.test.ts src/views/attestationState.test.ts 2>/dev/null | head -5
```

If neither view lane has committed, STOP and surface. 17V cannot run without at least one failing-test handoff.

### Source authority

- `memos/Actor-attestation-taxonomy.md` lines 555-585 (proposed `V-REVIEW-01..07`).
- `decisions/017-actor-attestation-review-taxonomy.md` lines 188+ (proposed-not-canonical `V-REVIEW-*` and `V-ATTEST-*` rule names; current lane reserves the prefix).
- ADR17-001 PRD taxonomy ledger rows T03–T06 (the rules' triggers).

### Goal

Land the shared validator + schema + profile-registry edits that 17b-VIEW and 17c-VIEW failing tests demand. Single integration lane; not parallel-safe with anything else.

### Owned files

1. `schemas/profiles/index.json`: append `"action.claim_review.v1"` and `"communication.attestation.v1"` to the profiles array. Bump version if registry contract changed; otherwise keep `"version": 1`.
2. `src/validate.ts`: add 11 new validator rules:
   - `V-REVIEW-01`: `action.claim_review.v1` events MUST identify ≥1 reviewed target via `data.reviewed_refs[]` OR `links.supports[*]` OR `links.contradicts[*]`.
   - `V-REVIEW-02`: `data.review_decision` MUST be one of `verified` / `accepted` / `rejected` / `needs_revision` / `deferred` / `co_signed`.
   - `V-REVIEW-03`: `accepted` / `verified` / `rejected` / `co_signed` outcomes MUST be authored by a non-agent `source.kind` / `author.role` (warning until role taxonomy formalized).
   - `V-REVIEW-04`: `rejected` outcomes MUST have `data.review.rationale` OR `links.contradicts[*].basis`.
   - `V-REVIEW-05`: `verified` outcomes MUST have either `data.review.basis` or a target whose `evidenceChain` resolves.
   - `V-REVIEW-06`: `co_signed` outcomes MUST have ≥1 target event/note AND a human/clinician reviewer.
   - `V-REVIEW-07`: `action.claim_review.v1` MUST NOT use `data.status_detail` until a status rule is registered for that subtype.
   - `V-ATTEST-01`: `communication.attestation.v1` events MUST set `data.attests_to` AND `data.attestation_role`.
   - `V-ATTEST-02`: `data.attestation_role` MUST be one of `verify` / `cosign` / `countersign` / `witness` / `scribe`.
   - `V-ATTEST-03`: `cosign` / `countersign` / `verify` roles MUST be authored by a clinician-family `source.kind`.
   - `V-ATTEST-04`: `scribe` role MUST set `data.on_behalf_of`.
3. `src/validate.test.ts`: integration tests using `validateChart(scope)` that exercise each new rule (RED-then-GREEN). Mirror the V-PROFILE-01 test pattern from V03-S4.
4. Optional: extend `STATUS_RULES` with `action:claim_review` (start as `["draft", "final"]` minimal, terminal `["final"]`); only if 17b-VIEW failing tests demand status semantics.

### Hard-gate red-then-green protocol

For every rule:

1. Check 17b-VIEW or 17c-VIEW test file mentions the rule by name (`grep V-REVIEW-01 src/views/`).
2. Write the validator-test that matches the view-lane's failing test (in `src/validate.test.ts`).
3. Run `npm test` — must show RED for the new validator test.
4. Implement the rule in `src/validate.ts`.
5. Run `npm test` — must show GREEN.
6. Commit per-rule with a descriptive message. DO NOT batch all 11 rules into one commit.

### Acceptance criteria

1. `schemas/profiles/index.json` contains `"action.claim_review.v1"` AND `"communication.attestation.v1"` in the profiles array.
2. `src/validate.ts` exports all 11 new rules wired into both `validateStructuralMarkdown` and `validateTimeline` paths (matching V-PROFILE-01 pattern).
3. `src/validate.test.ts` contains at least one test per V-REVIEW-* and V-ATTEST-* rule, RED-then-GREEN documented in commit history.
4. `npm test` passes; `npm run typecheck` passes; `npm run check` (validate) passes with no errors.
5. 17b-VIEW and 17c-VIEW tests still pass without modification (they project derived state independent of validator rules; the validator only enforces invariants).
6. `git diff --name-only` shows ONLY: `schemas/profiles/index.json`, `src/validate.ts`, `src/validate.test.ts`. Optional minor: `STATUS_RULES` extension still in `src/validate.ts`.
7. NO new top-level event field. NO change to `event.schema.json`'s `type` enum or `subtype` semantics.
8. NO mutation of existing validator rules (V-FULFILL, V-EXAMFIND, V-PROFILE, V-TRANSFORM, source-kind, status, etc.).

### Verification command

```bash
# Hard-gate verification
test -f src/views/reviewState.ts || (echo "ABORT: 17b-VIEW not committed" && exit 1)
test -f src/views/attestationState.ts || echo "WARN: 17c-VIEW not committed; running 17V scoped to V-REVIEW only"

# Standard verification
npm test 2>&1 > /tmp/full-test.log
grep -nE "^(ok|not ok)" /tmp/full-test.log | grep -v "^[0-9]*:ok " | head -10
tail -12 /tmp/full-test.log

npm run typecheck && npm run check

# Disjoint check
git diff --name-only | sort
git diff --name-only -- src/views/ docs/plans/ decisions/ patients/ package.json | head -1 | grep -q . && echo "FAIL: 17V-INTEGRATION touched another lane's territory" || echo "OK: 17V disjoint"

# Profile registry shape
cat schemas/profiles/index.json | python3 -m json.tool
```

### Stop boundaries

- DO NOT modify `src/views/projection.ts`, `src/views/reviewState.ts`, `src/views/attestationState.ts`. Lanes' owned files.
- DO NOT change `event.schema.json` (V03-S4 already added the `profile` field; no further schema change).
- DO NOT touch `decisions/017-actor-attestation-review-taxonomy.md` — canonical ADR boundary.
- DO NOT batch all rules into one commit. Per-rule commits.
- DO NOT skip the RED test step. Each rule must be observed as RED before implementation.

---

## Cross-lane invariants

1. No edits under `decisions/`. Canonical ADR boundary.
2. No edits under `docs/plans/`. Acceptance lane will update kanban after all three lanes land.
3. No edits to `package.json`, `package-lock.json`, lockfiles, or any dependency surface.
4. No new top-level event fields beyond `profile` (already added by V03-S4).
5. No `pi-agent`/`pi-sim` coupling.
6. Append-only fixtures with `adr17b-` / `adr17c-` / `adr17v-` prefixes if test fixtures needed.
7. `deriveReviewState` and `deriveAttestationState` MUST NOT do IO.
8. 17V-INTEGRATION HARD GATE: at least one view lane MUST commit before 17V starts.

## End-of-handoff verification (run AFTER all three lanes commit)

```bash
# Stage 1: tests pass
npm test 2>&1 > /tmp/full-test.log
grep -nE "^(ok|not ok)" /tmp/full-test.log | grep -v "^[0-9]*:ok " | head -10
tail -12 /tmp/full-test.log

# Stage 2: typecheck + check
npm run typecheck && npm run check

# Stage 3: only the expected files changed across all three lanes
git diff --name-only HEAD~3..HEAD | sort
# Expected (in some superset of):
# schemas/profiles/index.json
# src/validate.test.ts
# src/validate.ts
# src/views/attestationState.test.ts
# src/views/attestationState.ts
# src/views/reviewState.test.ts
# src/views/reviewState.ts

# Stage 4: profile registry shape
cat schemas/profiles/index.json
# Expected: {"version": 1, "profiles": ["action.claim_review.v1", "communication.attestation.v1"]}

# Stage 5: validator catches review/attestation invariants
grep -E "V-REVIEW-0[1-7]|V-ATTEST-0[1-4]" src/validate.ts | wc -l
# Expected: ≥ 11

# Stage 6: no unrelated edits
git diff --name-only HEAD~3..HEAD -- docs/plans/ decisions/ patients/ package.json | head -1 | grep -q . && echo "FAIL: planning/canonical surfaces touched" || echo "OK: planning/canonical surfaces untouched"
```

Pass criteria: all six stages green.

## What unlocks after all three lanes land

- Taxonomy ledger rows T03 (`accepted`), T04 (`verified`), T05 (`rejected`), T06 (`co-signed`) all become projection-derived AND validator-enforced.
- `MemoryProofEventMeta` projection (memo lines 217-261) can now compose `deriveAuthorshipClass` (17a) + `deriveReviewState` (17b) + `deriveAttestationState` (17c) into a full event-meta record.
- `accountable_actor` derivation (memo lines 619-629, 8-rule priority) becomes a follow-on view lane that consumes all three projections.
- ADR17-001 PRD's "split disposition staged" status moves to "split-implementation in progress"; HITL signs off; ADR17 board row moves to Done.
- Schema-version bump (registry from 1 to 2) becomes a clean follow-on if the profile registry contract evolves.

## Suggested executor

Per OMC routing:
- **17b-VIEW + 17c-VIEW**: spawn two `executor` agents (model=opus) in a `team` configuration. Disjoint owned files mean zero coordination cost. Estimated single-pass implementation per agent.
- **17V-INTEGRATION**: single `executor` agent (model=opus). Sequential after at least one view lane lands. Per-rule RED-GREEN discipline benefits from focused single-agent execution.
- **Verifier**: `verifier` agent runs the end-of-handoff verification after all three lanes commit. Confirms cross-lane invariants and profile-registry shape.

## Cleanup recommendation (carry-over from prior review)

Commit `136dd44` ("Remove off-scope artifacts from team execution diff") from the 17a + V03-S4 handoff round is worth a quick scan before this new handoff runs. Confirm nothing load-bearing got removed; commit message implied team workers staged extra files. Suggested check:

```bash
git show 136dd44 --stat
git show 136dd44 -- ':(exclude)*.test.ts' ':(exclude)*.ts' | head -50
```

If anything looks load-bearing, surface before starting 17b/17c lanes.
