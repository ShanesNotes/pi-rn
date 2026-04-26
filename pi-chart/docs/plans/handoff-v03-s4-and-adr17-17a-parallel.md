Status: agent-to-agent handoff. Parallel-safe execution.
Origin: HITL disposition recorded 2026-04-25 — V03-001 → S4 profiles workstream; ADR17-001 → split (17a actor classification first, 17a is projection-only).

# Handoff — V03-S4 profiles + ADR17-17a actor classification (parallel lanes)

## Mission

Two lanes execute in parallel. Disjoint owned files. Zero shared writes.

- **Lane 1 (V03-S4)** lands the `profile` field + profiles registry + `V-PROFILE-01` validator rule. This is foundation for ADR17-17b (claim_review.v1) and ADR17-17c (attestation.v1) which depend on `profile` being a recognized envelope field.
- **Lane 2 (ADR17-17a)** lands the projection-only `AuthorshipClass` derivation in the view layer. Memo recommendation C1 (no JSON schema change) + C3 (`source.kind` is provenance) + C4 (review events do not mutate original status) are load-bearing.

Neither lane edits `decisions/017-actor-attestation-review-taxonomy.md`, the canonical ADR; both stay within accepted-ADR boundaries.

## Disjoint ownership matrix

| File | Lane 1 (V03-S4) | Lane 2 (17a) |
|---|---|---|
| `schemas/event.schema.json` | OWNS (add `profile` string field; optional; no enum) | NOT touched |
| `schemas/profiles/` (NEW directory) | OWNS (create + seed `index.json`) | NOT touched |
| `src/validate.ts` | OWNS (add `V-PROFILE-01`) | NOT touched |
| `src/validate.test.ts` | OWNS (add V-PROFILE tests) | NOT touched |
| `src/views/projection.ts` (NEW file) | NOT touched | OWNS |
| `src/views/projection.test.ts` (NEW file) | NOT touched | OWNS |
| `patients/**` fixtures | append-only (Lane 2 may add minimal projection-test fixtures) | append-only |
| `docs/plans/kanban-prd-board.md` | NOT touched (board edit deferred to acceptance lane) | NOT touched |

Shared write target: NONE. Both lanes append-only into fixtures with prefixed event IDs (`v03s4-` for Lane 1 fixtures, `adr17a-` for Lane 2 fixtures).

Verification of disjoint-ownership: `git diff --name-only` after each lane commits should never overlap on a single file.

---

## Lane 1: V03-S4 profiles workstream

### Source authority

- `memos/pi-chart-v03-memo.md` §profiles section (cited by V03-001 PRD).
- `decisions/017-actor-attestation-review-taxonomy.md` lines 75-141 (proposed, not canonical) — references `profile: "action.claim_review.v1"` and `profile: "communication.attestation.v1"` as expected envelope shape. Lane 1 lands the foundation those references depend on, but does NOT promote ADR17 by implication; the `profile` field is type-agnostic.
- `schemas/event.schema.json` current shape — closed `type` enum, open `subtype` string, no `profile` field today.

### Brownfield evidence (read before editing)

```bash
grep -n "profile" schemas/event.schema.json || echo "no profile field"
grep -n "V-PROFILE\|profile_registry" src/validate.ts || echo "no profile validation"
ls schemas/profiles/ 2>/dev/null || echo "no profiles directory"
```

Expected stdout: all three commands print "no ..." messages (or empty result for `ls`). If any prints content, STOP and surface; the brownfield is not what this handoff assumes.

### Goal

Add an optional `profile` string field to the event envelope schema. Add a profiles registry under `schemas/profiles/index.json` listing the namespace for future profile entries. Add validator rule `V-PROFILE-01`: when present, `profile` must be a non-empty string and match a registered profile id from `schemas/profiles/index.json`. Unknown profile strings emit a validator warning (not error) so the system stays append-friendly while ADR17-17b/17c are pending.

### Owned files

1. `schemas/event.schema.json`:
   - Add to event object schema: `"profile": { "type": "string", "description": "Optional profile id; when set, must match an entry in schemas/profiles/index.json. See V-PROFILE-01." }`.
   - DO NOT add to `required`. Profile is optional.
   - DO NOT change `additionalProperties` semantics.

2. `schemas/profiles/index.json` (NEW):

   ```json
   {
     "version": 1,
     "profiles": []
   }
   ```

   Empty profile list is intentional. ADR17-17b/17c will append `action.claim_review.v1` / `communication.attestation.v1` later. V03-S4 only lands the registry.

3. `src/validate.ts`:
   - Add a top-level constant `PROFILE_REGISTRY` loaded from `schemas/profiles/index.json` at module init.
   - Add new validator rule `V-PROFILE-01` invoked from the existing event validation pipeline:
     ```ts
     // V-PROFILE-01: optional profile field must reference a registered profile id
     function validateProfile(state: State, where: string, ev: any) {
       if (ev?.profile === undefined) return;
       if (typeof ev.profile !== "string" || ev.profile.length === 0) {
         ruleErr(state, where, "V-PROFILE-01",
           `profile must be a non-empty string when present; got ${JSON.stringify(ev.profile)}`);
         return;
       }
       if (!PROFILE_REGISTRY.profiles.includes(ev.profile)) {
         ruleWarn(state, where, "V-PROFILE-01",
           `profile=${ev.profile} not in schemas/profiles/index.json registry`);
       }
     }
     ```
   - Wire `validateProfile` into the same place existing rules are dispatched. Reuse `ruleErr` / `ruleWarn` helpers already in the file.

4. `src/validate.test.ts`:
   - Add three new tests (use existing test scaffolding patterns from the file).

### First failing tests (write these BEFORE implementation)

```ts
// src/validate.test.ts
// HANDOFF: V03-S4 profile foundation. ADR17-17b/17c will append profile ids to the registry later.

test("V-PROFILE-01: event without profile field validates clean (profile is optional)", () => {
  const ev = makeMinimalEvent({ /* no profile */ });
  const r = validateEvent(ev);
  assert.ok(!r.errors.some((e) => e.message.includes("V-PROFILE-01")));
  assert.ok(!r.warnings.some((w) => w.message.includes("V-PROFILE-01")));
});

test("V-PROFILE-01: event with empty-string profile is rejected", () => {
  const ev = makeMinimalEvent({ profile: "" });
  const r = validateEvent(ev);
  assert.ok(r.errors.some((e) => e.message.includes("V-PROFILE-01")),
    "empty profile must be rejected");
});

test("V-PROFILE-01: event with unregistered profile emits a warning, not an error", () => {
  const ev = makeMinimalEvent({ profile: "action.claim_review.v1" });
  const r = validateEvent(ev);
  assert.ok(!r.errors.some((e) => e.message.includes("V-PROFILE-01")),
    "unregistered profile must NOT error (registry is empty in V03-S4)");
  assert.ok(r.warnings.some((w) => w.message.includes("V-PROFILE-01") && w.message.includes("not in") ),
    "unregistered profile must warn");
});
```

`makeMinimalEvent` is the existing helper used elsewhere in `src/validate.test.ts` — reuse, do not redefine.

### Acceptance criteria

1. `schemas/event.schema.json` contains optional `profile` string field. No other schema changes.
2. `schemas/profiles/index.json` exists with `{"version": 1, "profiles": []}`.
3. `src/validate.ts` exports validator behavior such that all three new tests pass.
4. `src/validate.test.ts` contains all three new tests with the literal test names above.
5. `npm test` passes (no regressions). `npm run typecheck` passes. `npm run check` passes.
6. `git diff --name-only` shows ONLY: `schemas/event.schema.json`, `schemas/profiles/index.json`, `src/validate.ts`, `src/validate.test.ts`.
7. NO file under `src/views/`, `decisions/`, `docs/plans/`, `patients/`, `package.json`, lockfiles is modified.

### Verification command

```bash
npm test 2>&1 > /tmp/full-test.log
grep -nE "^(ok|not ok)" /tmp/full-test.log | grep -v "^[0-9]*:ok " | head -10
echo "---"
tail -12 /tmp/full-test.log
echo "---"
git diff --name-only | sort
echo "---"
# Disjoint-from-Lane-2 check
git diff --name-only -- src/views/ | head -1 | grep -q . && echo "FAIL: Lane 1 touched src/views/" || echo "OK: Lane 1 did not touch src/views/"
```

### Stop boundaries

- DO NOT add any profile id to the registry beyond `[]`. The registry is intentionally empty.
- DO NOT add `V-PROFILE-02` or other profile rules. Only V-PROFILE-01.
- DO NOT touch `src/views/`. ADR17-17a owns that.
- DO NOT touch `decisions/`. Canonical ADR boundary.
- DO NOT touch `docs/plans/`. Acceptance lane will update kanban after both lanes land.
- DO NOT modify any existing validator rule or event subtype handling. Additive only.

---

## Lane 2: ADR17-17a actor classification (projection-only)

### Source authority

- `memos/Actor-attestation-taxonomy.md` lines 4-6 (load-bearing constraint C1: no schema change; derive in projection).
- `memos/Actor-attestation-taxonomy.md` lines 81-83 (C3: source.kind is provenance not review state).
- `memos/Actor-attestation-taxonomy.md` lines 217-260 (`AuthorshipClass` and `MemoryProofEventMeta` TypeScript shapes).
- `docs/plans/prd-adr17-actor-attestation-decision.md` taxonomy ledger rows T01, T02, T09, T10, T11 (the labels this lane unblocks).
- `src/validate.ts:66-91` (SOURCE_KIND_CANONICAL — provenance source-of-truth that drives the classification).

### Brownfield evidence (read before editing)

```bash
ls src/views/ | sort
grep -RIn "AuthorshipClass\|authorship_class\|projection.ts" src/views || echo "no projection helper"
grep -n "agent_inference\|nurse_charted\|clinician_chart_action" src/validate.ts | head -10
```

Expected: `src/views/` lists existing view files (evidenceChain, openLoops, currentState, timeline, memoryProof, etc.); no `projection.ts` exists yet; source-kind enum present in `src/validate.ts`.

### Goal

Create a new view-layer helper `src/views/projection.ts` that exports `deriveAuthorshipClass(event)` returning one of:

```ts
export type AuthorshipClass =
  | "human-authored"
  | "agent-authored"
  | "agent-on-behalf-of-human"
  | "device-authored"
  | "imported"
  | "unknown";
```

Derivation rules (memo lines 89-99 + lines 217-260, deterministic priority):

1. If `event.author.on_behalf_of` is set AND author is agent → `agent-on-behalf-of-human`.
2. Else if `source.kind` ∈ {`agent_inference`, `agent_synthesis`, `agent_bedside_observation`, `agent_action`, `agent_review`, `agent_reasoning`} → `agent-authored`.
3. Else if `source.kind` ∈ {`nurse_charted`, `clinician_chart_action`, `patient_statement`, `admission_intake`, `manual_lab_entry`, `dictation_system`} → `human-authored`.
4. Else if `source.kind` ∈ {`monitor_extension`, `poc_device`, `lab_analyzer`, `lab_interface_hl7`, `pacs_interface`, `pathology_lis`, `cardiology_reporting`, `endoscopy_reporting`, `protocol_standing_order`} → `device-authored`.
5. Else if `source.kind` ∈ {`synthea_import`, `mimic_iv_import`, `manual_scenario`} → `imported`.
6. Else → `unknown`.

The classification reads ONLY `event.author.on_behalf_of` and `event.source.kind`. It does NOT read `event.profile`, `event.transform`, or any review events. It does NOT mutate the event.

### Owned files

1. `src/views/projection.ts` (NEW):

   ```ts
   // SPDX or license header to match repo convention; check src/validate.ts top of file.

   import type { /* event types as already imported in other views */ } from "...";

   export type AuthorshipClass =
     | "human-authored"
     | "agent-authored"
     | "agent-on-behalf-of-human"
     | "device-authored"
     | "imported"
     | "unknown";

   const AGENT_KINDS = new Set([
     "agent_inference",
     "agent_synthesis",
     "agent_bedside_observation",
     "agent_action",
     "agent_review",
     "agent_reasoning",
   ]);

   const HUMAN_KINDS = new Set([
     "nurse_charted",
     "clinician_chart_action",
     "patient_statement",
     "admission_intake",
     "manual_lab_entry",
     "dictation_system",
   ]);

   const DEVICE_KINDS = new Set([
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

   const IMPORT_KINDS = new Set([
     "synthea_import",
     "mimic_iv_import",
     "manual_scenario",
   ]);

   export function deriveAuthorshipClass(event: any): AuthorshipClass {
     const onBehalfOf = event?.author?.on_behalf_of;
     const role = event?.author?.role;
     const kind = event?.source?.kind;
     const isAgentRole = role === "agent" || role === "rn_agent" || (role && role.endsWith("_agent"));
     if (onBehalfOf && isAgentRole) return "agent-on-behalf-of-human";
     if (kind && AGENT_KINDS.has(kind)) return "agent-authored";
     if (kind && HUMAN_KINDS.has(kind)) return "human-authored";
     if (kind && DEVICE_KINDS.has(kind)) return "device-authored";
     if (kind && IMPORT_KINDS.has(kind)) return "imported";
     return "unknown";
   }
   ```

2. `src/views/projection.test.ts` (NEW):

### First failing tests (write these BEFORE implementation)

```ts
// src/views/projection.test.ts
// HANDOFF: ADR17-17a actor classification. Unblocks taxonomy ledger rows T01, T02, T09, T10, T11.
// Memo: source.kind is provenance, not review state. Authorship-class is derived classification (memo C3).

import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveAuthorshipClass } from "./projection";

test("ADR17-17a: nurse_charted event projects as human-authored (T09)", () => {
  const ev = { source: { kind: "nurse_charted" }, author: { id: "rn_amy", role: "rn" } };
  assert.equal(deriveAuthorshipClass(ev), "human-authored");
});

test("ADR17-17a: agent_inference event projects as agent-authored (T10)", () => {
  const ev = { source: { kind: "agent_inference" }, author: { id: "pi_agent", role: "agent", run_id: "run_x" } };
  assert.equal(deriveAuthorshipClass(ev), "agent-authored");
});

test("ADR17-17a: agent_synthesis event projects as agent-authored (T10)", () => {
  const ev = { source: { kind: "agent_synthesis" }, author: { id: "pi_agent", role: "rn_agent", run_id: "run_y" } };
  assert.equal(deriveAuthorshipClass(ev), "agent-authored");
});

test("ADR17-17a: clinician_chart_action event projects as human-authored (T09)", () => {
  const ev = { source: { kind: "clinician_chart_action" }, author: { id: "md_lee", role: "hospitalist" } };
  assert.equal(deriveAuthorshipClass(ev), "human-authored");
});

test("ADR17-17a: monitor_extension event projects as device-authored", () => {
  const ev = { source: { kind: "monitor_extension" }, author: { id: "monitor_03", role: "system" } };
  assert.equal(deriveAuthorshipClass(ev), "device-authored");
});

test("ADR17-17a: synthea_import event projects as imported", () => {
  const ev = { source: { kind: "synthea_import" }, author: { id: "synthea", role: "system" } };
  assert.equal(deriveAuthorshipClass(ev), "imported");
});

test("ADR17-17a: agent author with on_behalf_of human projects as agent-on-behalf-of-human (T11)", () => {
  const ev = {
    source: { kind: "agent_action" },
    author: {
      id: "rn_agent_01",
      role: "rn_agent",
      run_id: "run_z",
      on_behalf_of: { id: "rn_amy", role: "rn" },
    },
  };
  assert.equal(deriveAuthorshipClass(ev), "agent-on-behalf-of-human");
});

test("ADR17-17a: human author with on_behalf_of does NOT project as agent-on-behalf-of-human (must be agent role)", () => {
  const ev = {
    source: { kind: "nurse_charted" },
    author: { id: "rn_amy", role: "rn", on_behalf_of: { id: "rn_pat", role: "rn" } },
  };
  // Scribe-style human delegation is NOT agent-on-behalf-of-human; it stays human-authored per memo lines 97-110.
  assert.equal(deriveAuthorshipClass(ev), "human-authored");
});

test("ADR17-17a: unknown source.kind projects as unknown", () => {
  const ev = { source: { kind: "totally_made_up_kind" }, author: { id: "x", role: "y" } };
  assert.equal(deriveAuthorshipClass(ev), "unknown");
});

test("ADR17-17a: missing source.kind projects as unknown", () => {
  const ev = { author: { id: "x", role: "y" } };
  assert.equal(deriveAuthorshipClass(ev), "unknown");
});

test("ADR17-17a: deriveAuthorshipClass does not mutate event (memo C4)", () => {
  const ev = { source: { kind: "agent_inference" }, author: { id: "pi", role: "agent" } };
  const snapshot = JSON.stringify(ev);
  deriveAuthorshipClass(ev);
  assert.equal(JSON.stringify(ev), snapshot, "projection must not mutate event");
});
```

### Acceptance criteria

1. `src/views/projection.ts` exports `deriveAuthorshipClass` and `AuthorshipClass` type with exactly six values.
2. `src/views/projection.test.ts` contains all 11 tests with the literal test names above.
3. All 11 tests pass under `node --test --import tsx src/views/projection.test.ts` (or whichever runner the repo uses; check `package.json` test script).
4. `npm test` passes (no regressions). `npm run typecheck` passes.
5. `git diff --name-only` for this lane shows ONLY: `src/views/projection.ts`, `src/views/projection.test.ts`.
6. NO file under `schemas/`, `src/validate.ts`, `src/validate.test.ts`, `decisions/`, `docs/plans/`, `patients/` is modified.
7. `deriveAuthorshipClass` MUST NOT read `event.profile` (Lane 1 owns that field; Lane 2 stays decoupled).
8. `deriveAuthorshipClass` MUST NOT mutate the input event.

### Verification command

```bash
node --test --import tsx src/views/projection.test.ts 2>&1 | tail -20
echo "---"
npm test 2>&1 > /tmp/full-test.log
grep -nE "^(ok|not ok)" /tmp/full-test.log | grep -v "^[0-9]*:ok " | head -10
echo "---"
tail -12 /tmp/full-test.log
echo "---"
git diff --name-only | sort
echo "---"
# Disjoint-from-Lane-1 check
git diff --name-only -- schemas/ src/validate.ts src/validate.test.ts | head -1 | grep -q . && echo "FAIL: Lane 2 touched Lane-1 territory" || echo "OK: Lane 2 stayed in src/views/"
```

### Stop boundaries

- DO NOT add `ReviewState`, `accountable_actor`, or `MemoryProofEventMeta` derivation. Those are 17b/17c follow-on lanes.
- DO NOT read `event.profile`. Lane 1 owns the profile field; Lane 2 must stay decoupled so the lanes can land in either order.
- DO NOT touch `schemas/`, `src/validate.ts`, `src/validate.test.ts`. Lane 1 owns those.
- DO NOT touch `decisions/`. Canonical ADR boundary.
- DO NOT touch `docs/plans/`. Acceptance lane will update kanban after both lanes land.
- DO NOT add a top-level `attestation`, `review_status`, or `attested_by` field anywhere. Memo C1 forbids schema changes for review state.

---

## Cross-lane invariants

Both lanes MUST satisfy:

1. No edit under `decisions/`.
2. No edit under `docs/plans/`.
3. No edit under `patients/` except append-only fixture additions with prefixed event IDs (`v03s4-` for Lane 1, `adr17a-` for Lane 2). Most likely no fixture edits are needed at all.
4. No edit to `package.json`, `package-lock.json`, or any lockfile.
5. No new top-level event field beyond Lane 1's `profile` string. No top-level `attestation`, `review_status`, `attested_by`, `review_state`, `review_chain`, `authorship_class`, `accountable_actor`, or `needs_human_review` fields anywhere.
6. No coupling to `pi-agent` or `pi-sim` directories. No use of hidden simulator state.
7. No edit to existing validator rules. Lane 1 only ADDS `V-PROFILE-01`. Lane 2 only ADDS `src/views/projection.ts`.

## End-of-handoff verification (run AFTER both lanes commit)

```bash
# Stage 1: tests pass
npm test 2>&1 > /tmp/full-test.log
grep -nE "^(ok|not ok)" /tmp/full-test.log | grep -v "^[0-9]*:ok " | head -10
echo "---"
tail -12 /tmp/full-test.log
echo "---"

# Stage 2: typecheck + check
npm run typecheck && npm run check
echo "---"

# Stage 3: confirm only the expected files changed in BOTH lanes combined
git diff --name-only HEAD~2..HEAD | sort
# Expected exactly:
# schemas/event.schema.json
# schemas/profiles/index.json
# src/validate.test.ts
# src/validate.ts
# src/views/projection.test.ts
# src/views/projection.ts
echo "---"

# Stage 4: brownfield invariant — review-policy markers must STILL be absent
grep -RIn "V-REVIEW-\|V-ATTEST-\|claim_review\|^attestation\|review_status\|attested_by\|review_state\|authorship_class\|accountable_actor" schemas src patients | grep -v "test\|memos/\|docs/plans/" || echo "OK: no review-policy markers leaked into product code"
echo "---"

# Stage 5: profile registry stays empty (V03-S4 scope)
cat schemas/profiles/index.json
# Expected: {"version": 1, "profiles": []}
echo "---"

# Stage 6: disjoint-from-PHA + disjoint-from-ADR17-decision-lane
git diff --name-only HEAD~2..HEAD -- docs/plans/ decisions/ | head -1 | grep -q . && echo "FAIL: planning surfaces edited" || echo "OK: planning surfaces untouched"
```

Pass criteria:

1. `npm test` shows all green; no failed tests.
2. `npm run typecheck` exits 0; `npm run check` exits 0.
3. Exactly six files changed across the two commits.
4. Brownfield invariant grep is empty (or only shows test fixtures / docs references, not product code).
5. `schemas/profiles/index.json` contains `"profiles": []`.
6. No edits under `docs/plans/` or `decisions/`.

## What unlocks after both lanes land

- ADR17-17b claim review lane becomes runnable. It owns `schemas/profiles/index.json` (append `action.claim_review.v1`), `schemas/event.schema.json` (extend `action.subtype` enum candidates if applicable), and `src/validate.ts` (add `V-REVIEW-01..07`).
- ADR17-17c professional attestation lane becomes runnable. It owns the `communication.attestation.v1` profile registration and `V-ATTEST-01..04`.
- Future projection lanes (review-state, accountable-actor) can now build on `deriveAuthorshipClass` from Lane 2.
- Taxonomy ledger row T11 (`agent-on-behalf-of-human`) is no longer HITL-needed — Lane 2 lands the projection-derived path the memo recommended (lines 97-110).

## Suggested executor

Per OMC routing: `executor` agent with `model=opus` (two parallel implementation slices, both involve repo-wide invariant respect; opus warranted for the cross-lane discipline). Or `team` with two members: one per lane. Verifier should run end-of-handoff verification.
