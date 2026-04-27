# RALPLAN — ADR17 17b/17c views + 17V validator integration

Status: consensus approved for execution handoff. Source handoff: `docs/plans/handoff-adr17-17b-17c-views-and-17v-integration.md`.
Context snapshot: `.omx/context/adr17-views-17v-integration-20260426T041121Z.md`.

## Requirements Summary

Implement the handoff as a three-lane, PHA-pattern-isolated execution plan:

1. **17b-VIEW** creates a pure review-state projection in `src/views/reviewState.ts` with characterization tests in `src/views/reviewState.test.ts`.
2. **17c-VIEW** creates a pure attestation-state projection in `src/views/attestationState.ts` with characterization tests in `src/views/attestationState.test.ts`.
3. **17V-INTEGRATION** runs after the full hard gate and owns shared validator/profile writes: `schemas/profiles/index.json`, `src/validate.ts`, `src/validate.test.ts`. The handoff minimum says “after ≥1 view lane”; this plan tightens full 17V to require **both** view lanes because full 17V registers both profiles and implements all 11 rules. If execution starts after only one view lane, it must be explicitly renamed/scoped as partial 17V and must not claim full handoff completion.

Execution must preserve strict lane isolation. View lanes may characterize profile/rule contracts through tests and comments, but they must not register profiles, add validator rules, or modify shared validation files.

## Evidence and Grounding

- Handoff file defines the ownership matrix and hard-gate DAG: `docs/plans/handoff-adr17-17b-17c-views-and-17v-integration.md`.
- Existing projection foundation exists and exports `deriveAuthorshipClass` from `src/views/projection.ts`; 17b/17c must reuse, not edit it.
- Existing profile registry foundation is present in `src/validate.ts` (`PROFILE_REGISTRY`, `V-PROFILE-01`) and `schemas/profiles/index.json`.
- Existing review status subtypes exist in `src/validate.ts` under `STATUS_RULES` for `action:result_review`, `action:constraint_review`, and `action:problem_review`.
- Source taxonomy authority exists in `memos/Actor-attestation-taxonomy.md` lines 217-261, 503-585, 619-629 and `decisions/017-actor-attestation-review-taxonomy.md` lines 75-153, 188-214.
- Current repo has unrelated dirty files (`docs/prototypes/pi-chart-agent-canvas.html`, `package.json`, `package-lock.json`, `scripts/agent-canvas.ts`); execution must not conflate these with ADR17 lane diffs.
- Carry-over scan of commit `136dd44` shows only removal of an off-scope `.omx/plans/...` artifact and tracked `node_modules`; no ADR17 load-bearing source was removed.

## RALPLAN-DR Summary

### Principles

1. **Append/projection separation:** review and attestation state are derived from append-only events; do not mutate target events or add top-level event fields.
2. **Lane isolation before integration:** view characterization lanes remain decoupled from shared schema/validator writes.
3. **TDD hard gate:** view lanes first observe RED then GREEN for their pure modules; 17V later consumes grepable contract markers and observes its own validator RED-then-GREEN per rule. 17V does not require currently failing view tests.
4. **Brownfield compatibility:** reuse `deriveAuthorshipClass`, existing review subtype status rules, and `V-PROFILE-01` registry patterns.
5. **Minimal surface:** no dependencies, no canonical ADR/doc rewrites, no package/lockfile changes for ADR17.

### Decision Drivers

1. `schemas/profiles/index.json`, `src/validate.ts`, and `src/validate.test.ts` are shared writes for both profile types; they must be centralized in 17V to avoid cross-lane collisions.
2. `src/views/reviewState.ts` and `src/views/attestationState.ts` are disjoint new modules, so 17b and 17c can execute safely in parallel.
3. The handoff explicitly mirrors the earlier PHA pattern: view lanes emit and then satisfy view-level contract tests, then a single integration lane consumes their grepable validator contract markers.

### Viable Options

| Option | Approach | Pros | Cons | Verdict |
|---|---|---|---|---|
| A | Two lanes: one view lane and one integration lane. | Simpler coordination. | Forces 17b and 17c to serialize despite disjoint view files; loses parallel speed. | Rejected. |
| B | Three lanes: 17b-VIEW + 17c-VIEW in parallel, 17V sequential after hard gate. | Matches handoff, avoids shared-write collisions, preserves TDD gate. | Requires strict gate checks and final integration verification. | Chosen. |
| C | One executor implements all files in one sequence. | Lowest orchestration overhead. | Higher risk of accidental cross-scope edits and batched validator rules; weaker evidence trail. | Rejected except as fallback if team runtime is unavailable. |

## Acceptance Criteria

### 17b-VIEW

- Adds only `src/views/reviewState.ts` and `src/views/reviewState.test.ts`.
- Exports `ReviewState` with the 9 specified literals and `deriveReviewState(targetEventId: string, allEvents: ReadonlyArray<unknown>): ReviewState`.
- Covers all handoff derivation rules, edge cases, purity/no-mutation, and brownfield review subtype handling.
- Includes explicit contract literals for `V-REVIEW-01` through `V-REVIEW-07` in test names or handoff comments, without importing or asserting validator behavior.
- Does not touch `src/views/projection.ts`, validator/schema/profile files, docs, decisions, package files, or the 17c module.

### 17c-VIEW

- Adds only `src/views/attestationState.ts` and `src/views/attestationState.test.ts`.
- Exports `AttestationRole`, `AttestationState`, and `deriveAttestationState` exactly as specified.
- Covers all handoff derivation rules, edge cases, defensive role validation, scribe `on_behalf_of`, ordering, purity/no-mutation.
- Includes explicit contract literals for `V-ATTEST-01` through `V-ATTEST-04` in test names or handoff comments, without importing or asserting validator behavior.
- Does not touch validator/schema/profile files, docs, decisions, package files, `src/views/projection.ts`, or the 17b module.

### 17V-INTEGRATION

- Starts full 17V only after both view modules and test files exist, both view test files pass, and hard-gate grep finds all required markers: `V-REVIEW-01..07` in `src/views/reviewState.test.ts` and `V-ATTEST-01..04` in `src/views/attestationState.test.ts`.
- Updates only `schemas/profiles/index.json`, `src/validate.ts`, and `src/validate.test.ts`.
- Registers `action.claim_review.v1` and `communication.attestation.v1` in the profile registry.
- Adds validator coverage for 11 rules: `V-REVIEW-01..07` and `V-ATTEST-01..04`.
- Lands each validator rule RED-then-GREEN and, when committing, uses one commit per rule or a clearly documented equivalent if commits are externally unavailable.
- Keeps `event.schema.json`, canonical decisions, docs/plans, package files, and view modules untouched.

### Normalized 17V rule matrix

The handoff is the current execution authority for rule numbering. Memo/ADR text is source evidence, but conflicting reserved-rule meanings are deferred rather than silently mixed into these codes.

| Rule | Primary authority | Canonical payload checked in 17V | Tolerated legacy / compatibility | Severity | View marker source | Validator test obligation |
|---|---|---|---|---|---|---|
| V-REVIEW-01 | Handoff + ADR reviewed target shape | `action.claim_review.v1` / subtype `claim_review` identifies ≥1 target via `data.reviewed_refs[]`, `links.supports[*]`, or `links.contradicts[*]` | Supports string refs and object refs; profile is confirmation, subtype is required compatibility anchor | error | 17b | missing target fails; target via each accepted path passes |
| V-REVIEW-02 | Handoff + ADR decision enum | `data.review_decision` in `verified`, `accepted`, `rejected`, `needs_revision`, `deferred`, `co_signed` | `data.review.outcome` may be read as legacy/memo shape for `accepted`, `verified`, `rejected`, `co_signed` if implemented cheaply | error | 17b | invalid decision fails; allowed decision passes |
| V-REVIEW-03 | Handoff + memo warning-first guidance | accountability outcomes (`accepted`, `verified`, `rejected`, `co_signed`) require non-agent reviewer by `source.kind` / `author.role` | agent-on-behalf-of-human remains warning/unknown until role taxonomy formalized | warning | 17b | agent-authored reviewer warns; clinician/human source does not warn |
| V-REVIEW-04 | Handoff + memo rationale rule | rejected outcome requires `data.rationale`, `data.review.rationale`, or `links.contradicts[*].basis` | ADR example uses `data.rationale`; memo uses `data.review.rationale` | error | 17b | rejected without rationale/basis fails; with basis passes |
| V-REVIEW-05 | Handoff + memo evidence-basis rule | verified outcome requires `data.review.basis`, `data.basis`, or resolvable target evidence chain where available | If evidence-chain resolution is too broad, implement explicit-basis enforcement now and document evidence-chain resolution as follow-up | error | 17b | verified without explicit basis/evidence-chain support errors; with explicit basis passes |
| V-REVIEW-06 | Handoff + memo cosign rule | co_signed outcome requires ≥1 target event/note plus human/clinician reviewer | String/object support refs accepted | error | 17b | co_signed without target or human reviewer fails; valid cosign passes |
| V-REVIEW-07 | Handoff status-detail guard | `action.claim_review.v1` must not use `data.status_detail` until status rule exists | Do not register `action:claim_review` status rule unless tests force it | error | 17b | status_detail on claim_review fails |
| V-ATTEST-01 | Handoff, with ADR target-match evidence | `communication.attestation.v1` sets `data.attests_to` and `data.attestation_role` | `data.attestation_target` may be view-only legacy match; validator can require canonical `attests_to` | error | 17c | missing either field fails; both fields pass |
| V-ATTEST-02 | Handoff role enum | `data.attestation_role` in `verify`, `cosign`, `countersign`, `witness`, `scribe` | ADR reserved V-ATTEST-02 (`on_behalf_of != author.id`) is deferred/not this code | error | 17c | unknown role fails |
| V-ATTEST-03 | Handoff clinician-family author rule | `cosign`, `countersign`, `verify` roles require clinician-family `source.kind` / reviewer source | ADR reserved V-ATTEST-03 (`scribe requires on_behalf_of`) is implemented as V-ATTEST-04 per handoff | warning (role taxonomy remains informal; warnings do not flip `ok`) | 17c | agent/device source emits warning; clinician source emits no V-ATTEST-03 warning |
| V-ATTEST-04 | Handoff scribe rule | `scribe` role requires `data.on_behalf_of` | Optional extra check `on_behalf_of !== author.id` can be added as a same-test assertion only if it does not renumber rules | error | 17c | scribe without on_behalf_of fails; with on_behalf_of passes |

Deferred/not in this lane: ADR reserved gate semantics for “N distinct attestation events before lifecycle transition” remain future profile/write-path behavior, not a global validator rule in this handoff.

### Exact reviewer/clinician authority sets

Use these local constants/helpers in `src/validate.ts` for ADR17 rules; do not infer ad hoc sets in tests:

- `AGENT_REVIEWER_SOURCE_KINDS`: `agent_inference`, `agent_synthesis`, `agent_bedside_observation`, `agent_action`, `agent_review`, `agent_reasoning`.
- `HUMAN_REVIEWER_SOURCE_KINDS`: `nurse_charted`, `clinician_chart_action`, `patient_statement`, `admission_intake`, `manual_lab_entry`, `dictation_system`.
- `CLINICIAN_FAMILY_SOURCE_KINDS`: `nurse_charted`, `clinician_chart_action`, `manual_lab_entry`, `dictation_system`.
- `CLINICIAN_FAMILY_AUTHOR_ROLES`: `rn`, `lpn`, `np`, `pa`, `md`, `do`, `hospitalist`, `physician`, `clinician`, `resident`, `fellow`, `pharmacist`, `rt`, `therapist`.

Rule interpretation:

- V-REVIEW-03 and V-REVIEW-06 pass if source.kind is in `HUMAN_REVIEWER_SOURCE_KINDS` and not in `AGENT_REVIEWER_SOURCE_KINDS`; they warn/error as specified if source.kind is agent-family or if author.role is clearly agent-family (`agent`, `rn_agent`, or suffix `_agent`).
- V-ATTEST-03 emits a warning if `cosign` / `countersign` / `verify` lacks either a `CLINICIAN_FAMILY_SOURCE_KINDS` source.kind or a `CLINICIAN_FAMILY_AUTHOR_ROLES` author.role.
- These sets are intentionally local validator helpers. Do not edit `src/views/projection.ts` for ADR17.

### Exact review-state projection mapping

17b must make the mapping executable rather than relying on ambiguous prose:

- `data.review_decision: "verified"` maps to `ReviewState "accepted"` for the handoff’s rule-6 snippet unless `data.review.basis` or `data.basis` explicitly carries checked-evidence semantics; then it may map to `"verified"`.
- `data.review_decision: "accepted"` maps to `"accepted"`.
- `data.review_decision: "rejected"` maps to `"rejected"`.
- `data.review_decision: "co_signed"` or `data.review.outcome: "co_signed"` maps to `"co_signed"`.
- Brownfield `data.status_detail: "acknowledged"` may map to `"accepted"`; if the lane chooses `"none"` for brownfield conservatism, it must document the choice in the test comment exactly as the handoff permits.
- The distinct `"verified"` state is reserved for review events that carry an explicit checked-evidence basis; add at least one 17b test for that branch if implementing it now.


### End-to-end

- `npm test`, `npm run typecheck`, and `npm run check` pass after all lanes.
- Final expected ADR17 file set is exactly: `schemas/profiles/index.json`, `src/validate.ts`, `src/validate.test.ts`, `src/views/reviewState.ts`, `src/views/reviewState.test.ts`, `src/views/attestationState.ts`, `src/views/attestationState.test.ts`.
- No `pi-agent`/`pi-sim` coupling and no new dependencies.

## Implementation Plan

### Phase 0 — Preflight and isolation

1. Record the dirty-tree and commit baseline **before any ADR17 lane work**:

   ```bash
   export ADR17_BASE_REF=$(git rev-parse HEAD)
   git status --short > /tmp/adr17-preflight-status.txt
   ```

   Current unrelated dirty files must either remain untouched or be isolated via a temporary worktree/branch strategy. Final verification must use `ADR17_BASE_REF`; do not compute a fallback baseline after work has started.
2. Confirm carry-over commit `136dd44` is non-load-bearing for ADR17; scan already indicates only off-scope artifact removal.
3. Confirm foundations: `src/views/projection.ts`, `PROFILE_REGISTRY`, `V-PROFILE-01`, and `schemas/profiles/index.json` exist.

### Phase 1 — Parallel view characterization lanes

#### 17b-VIEW

1. Add the `reviewState` test file first, including the handoff tests plus explicit `V-REVIEW-01..07` contract markers.
2. Observe initial RED for missing module.
3. Implement `deriveReviewState` as a pure module:
   - normalize `links.supports`, `links.contradicts`, `links.supersedes`, `links.corrects` whether string or object refs;
   - match `claim_review` by subtype/profile and brownfield review subtypes by `type/subtype`;
   - treat agent-authored no-review targets as `suggested`, human-authored as `none`;
   - map decisions/outcomes to `accepted`, `verified`, `rejected`, `co_signed`, `contested`, `superseded`, `entered_in_error`;
   - do not rely on profile for required behavior.
4. Run lane tests, `npm test`, `npm run typecheck`, and lane disjoint diff check.

#### 17c-VIEW

1. Add the `attestationState` test file first, including the handoff tests plus explicit `V-ATTEST-01..04` contract markers.
2. Observe initial RED for missing module.
3. Implement `deriveAttestationState` as a pure module:
   - match subtype/profile attestation events by `data.attests_to`, `data.attestation_target`, or `links.supports[*].ref`;
   - validate allowed roles defensively;
   - reject `scribe` without `data.on_behalf_of`;
   - order chains by `recorded_at` with stable fallback;
   - return author id as `by`, defaulting safely if missing.
4. Run lane tests, `npm test`, `npm run typecheck`, and lane disjoint diff check.

### Phase 2 — 17V hard gate

1. Verify both view lanes are landed and passing before full 17V:

   ```bash
   test -f src/views/reviewState.ts && test -f src/views/reviewState.test.ts
   test -f src/views/attestationState.ts && test -f src/views/attestationState.test.ts
   node --test --import tsx src/views/reviewState.test.ts
   node --test --import tsx src/views/attestationState.test.ts
   for code in V-REVIEW-01 V-REVIEW-02 V-REVIEW-03 V-REVIEW-04 V-REVIEW-05 V-REVIEW-06 V-REVIEW-07; do
     grep -q "$code" src/views/reviewState.test.ts || { echo "missing $code in reviewState.test.ts"; exit 1; }
   done
   for code in V-ATTEST-01 V-ATTEST-02 V-ATTEST-03 V-ATTEST-04; do
     grep -q "$code" src/views/attestationState.test.ts || { echo "missing $code in attestationState.test.ts"; exit 1; }
   done
   ```

2. If either view lane is absent, failing, or missing any individual marker, stop full 17V and return to that view lane.
3. Partial 17V after only one view lane is not the default. It is allowed only if explicitly renamed and scoped (for example “17V-REVIEW-only”), and it must not register/claim the other profile family or final handoff completion.
4. Full 17V consumes grepable markers from passing view tests, not currently failing view tests. It then creates its own validator tests that are RED before each implementation step.

### Phase 3 — 17V integration TDD

1. Append both profile ids in `schemas/profiles/index.json` while preserving version `1` unless the registry contract changes. Then update the existing `V-PROFILE-01: event with unregistered profile emits a warning` test in `src/validate.test.ts` to use a dummy unregistered profile such as `example.unregistered_profile.v1`, because `action.claim_review.v1` becomes registered in this lane.
2. For each `V-REVIEW-*` / `V-ATTEST-*` rule:
   - add a targeted `src/validate.test.ts` case using existing fixture/helper patterns;
   - run the focused test to observe RED;
   - implement the smallest validator helper/wiring in `src/validate.ts`;
   - run focused test then `npm test` to observe GREEN;
   - commit or record the per-rule RED/GREEN evidence before proceeding.
3. Treat the normalized rule matrix below as the execution spec. It uses handoff numbering as primary current authority, tolerates memo/ADR legacy payloads where safe, and defers conflicting reserved-rule semantics instead of silently renumbering.
4. Add `action:claim_review` to `STATUS_RULES` only if tests require `data.status_detail` semantics; otherwise enforce `V-REVIEW-07` without registering status_detail.

### Phase 4 — Final verification

Run the six-stage end-of-handoff verification:

1. `npm test` and inspect failures.
2. `npm run typecheck && npm run check`.
3. Diff expected files only across lane commits.
4. Pretty-print `schemas/profiles/index.json` and confirm both profiles.
5. Confirm validator rule codes appear at least once each in `src/validate.ts` and have tests.
6. Confirm no edits under `docs/plans/`, `decisions/`, `patients/`, package files, or cross-project directories.

## Risks and Mitigations

- **Risk:** View tests in the handoff snippets do not consistently contain literal validator rule names, but 17V gate requires grepable rule names. **Mitigation:** add explicit contract comments/test names for `V-REVIEW-01..07` and `V-ATTEST-01..04` in view tests without adding validator logic.
- **Risk:** Handoff's 11 rule definitions differ from the reserved-rule prose in `decisions/017`. **Mitigation:** use the handoff as current execution authority; document any divergence in commits and do not renumber.
- **Risk:** Current unrelated dirty tree pollutes lane diffs. **Mitigation:** baseline status before work; use `git diff --name-only -- <lane paths>` and expected-file checks; prefer isolated worktree if execution agent controls git.
- **Risk:** Validator rules may need event/reference helpers that tempt broad refactors. **Mitigation:** keep local helper functions in `src/validate.ts`, reuse existing patterns, no dependency or schema expansion.
- **Risk:** Parallel workers accidentally touch shared files. **Mitigation:** explicit owned-file prompts and post-lane disjoint checks.
- **Risk:** Existing `V-PROFILE-01` unregistered-profile test uses `action.claim_review.v1` and will become stale after registry append. **Mitigation:** 17V must change that fixture to a dummy unregistered id before claiming tests green.

## Verification Commands

```bash
# 17b lane
node --test --import tsx src/views/reviewState.test.ts
npm test
npm run typecheck
git diff --name-only -- schemas/ src/validate.ts src/validate.test.ts src/views/attestationState.ts src/views/projection.ts

# 17c lane
node --test --import tsx src/views/attestationState.test.ts
npm test
npm run typecheck
git diff --name-only -- schemas/ src/validate.ts src/validate.test.ts src/views/reviewState.ts src/views/projection.ts

# 17V gate
grep -E "V-REVIEW-0[1-7]|V-ATTEST-0[1-4]" src/views/reviewState.test.ts src/views/attestationState.test.ts

# Final (requires preflight baseline; do not assume HEAD~3 when per-rule commits exist)
test -n "${ADR17_BASE_REF:-}" || { echo "ADR17_BASE_REF was not recorded before execution"; exit 1; }
test "$(git rev-parse HEAD)" != "$ADR17_BASE_REF" || { echo "ADR17_BASE_REF equals current HEAD; no committed ADR17 range to verify"; exit 1; }
npm test
npm run typecheck
npm run check
git diff --name-only "$ADR17_BASE_REF"..HEAD | sort
cat schemas/profiles/index.json | python3 -m json.tool
for code in V-REVIEW-01 V-REVIEW-02 V-REVIEW-03 V-REVIEW-04 V-REVIEW-05 V-REVIEW-06 V-REVIEW-07 V-ATTEST-01 V-ATTEST-02 V-ATTEST-03 V-ATTEST-04; do
  grep -q "$code" src/validate.ts || { echo "missing $code implementation"; exit 1; }
  grep -q "$code" src/validate.test.ts || { echo "missing $code test"; exit 1; }
done
git diff --name-only "$ADR17_BASE_REF"..HEAD -- docs/plans/ decisions/ patients/ package.json package-lock.json | { ! grep -q .; }
```

## ADR

### Decision

Use a hardened version of the three-lane handoff: parallel 17b/17c view characterization lanes followed by one sequential **full** 17V integration lane for shared profile and validator writes. Full 17V waits for both view lanes even though the original handoff minimum allowed ≥1 lane, because final 17V scope registers both profiles and implements both rule families.

### Drivers

- Shared validator/profile files must not be touched by multiple parallel lanes.
- View helpers are disjoint and pure, so they can be developed independently.
- 17V needs passing view-level contract markers plus its own RED/GREEN validator evidence before landing validator behavior.

### Alternatives considered

- **Two-lane implementation:** rejected because it serializes independent view work and weakens isolation.
- **Single executor all-at-once:** rejected as the primary path because it increases batching and off-scope edit risk.
- **Let view lanes add registry/rules:** rejected because it creates direct shared-write collisions and violates the handoff's PHA pattern.

### Why chosen

The three-lane structure matches the handoff's ownership matrix and prior PHA execution pattern while allowing safe parallelism where the write sets are disjoint. Tightening full 17V to require both view lanes removes the “≥1 lane but all 11 rules” ambiguity without changing file ownership.

### Consequences

- Requires strict gate discipline before full 17V starts; partial 17V must be explicitly renamed/scoped if ever used.
- Requires final verification to distinguish ADR17 changes from existing dirty-tree changes.
- Makes future MemoryProof/accountable-actor projection lanes cleaner because review and attestation projection helpers land separately from validation rules.

### Follow-ups

- After all lanes land, compose `deriveAuthorshipClass`, `deriveReviewState`, and `deriveAttestationState` into future `MemoryProofEventMeta` projection.
- Add accountable-actor derivation as a follow-on view lane using memo priority rules.
- Consider registry version bump only if profile registry semantics evolve beyond id registration.

## Available-Agent-Types Roster

- `executor`: implementation and refactoring; primary lane worker.
- `test-engineer`: test design and RED/GREEN evidence checks.
- `verifier`: final evidence, diff-boundary, and command verification.
- `architect`: read-only design review for rule/source conflicts.
- `critic`: quality gate for plan/lane conformance.
- `build-fixer`: targeted recovery if `npm test`, `typecheck`, or `check` fails.
- `git-master`: optional commit hygiene/per-rule lore commits if commit creation is in scope.

## Follow-up Staffing Guidance

### `$team` path (recommended)

- Worker 1: `executor`, 17b-VIEW, medium/high reasoning, owns only `src/views/reviewState.ts` and `src/views/reviewState.test.ts`.
- Worker 2: `executor`, 17c-VIEW, medium/high reasoning, owns only `src/views/attestationState.ts` and `src/views/attestationState.test.ts`.
- Leader or Worker 3 after gate: `executor`, 17V-INTEGRATION, high reasoning, owns only `schemas/profiles/index.json`, `src/validate.ts`, `src/validate.test.ts`.
- Final: `verifier`, high reasoning, runs six-stage verification and checks dirty-tree isolation.
- Optional recovery: `build-fixer` if verification fails.

Launch hint after this draft is promoted to `.omx/plans/ralplan-adr17-views-17v-integration.md`:

```bash
$team "Execute .omx/plans/ralplan-adr17-views-17v-integration.md. Start with two parallel executor lanes 17b-VIEW and 17c-VIEW using the owned-file matrix. Do not let view lanes touch validator/profile files. After both view lanes land, pass their focused tests, and hard-gate marker grep succeeds for all V-REVIEW/V-ATTEST contract markers, run one sequential full 17V executor with per-rule RED/GREEN discipline, then verifier runs the six-stage handoff pipeline."
```

If using OMX CLI directly:

```bash
omx team --prompt "Execute .omx/plans/ralplan-adr17-views-17v-integration.md with two parallel view executors, one sequential 17V executor, and final verifier."
```

### `$ralph` path

Use Ralph only if team runtime is unavailable or a single-owner audit trail is preferred. Ralph should execute 17b, then 17c, then 17V sequentially, preserving the same owned-file checks and per-rule RED/GREEN discipline.

Launch hint after promotion:

```bash
$ralph "Execute .omx/plans/ralplan-adr17-views-17v-integration.md sequentially. Preserve lane boundaries, observe RED before GREEN for view modules and each validator rule, and run final six-stage verification."
```

## Team Verification Path

Before shutdown, the team must prove:

1. 17b and 17c lane diffs are disjoint and only contain owned files.
2. 17V hard-gate grep was run and passed before validator edits.
3. Each validator rule code appears individually in both `src/validate.ts` and `src/validate.test.ts`; `V-ATTEST-03` is asserted as a warning, and all other structural ADR17 rules assert errors unless the rule matrix says otherwise.
4. `npm test`, `npm run typecheck`, and `npm run check` pass.
5. Final diff is checked against preflight `ADR17_BASE_REF`, not `HEAD~3` or a post-work fallback, and excludes docs/plans, decisions, patients, package files, and cross-project files.
6. Current pre-existing unrelated dirty files are explicitly reported as pre-existing and not modified by ADR17 lanes.

## Draft Changelog

- Iteration 5: made preflight `ADR17_BASE_REF` mandatory and final verification fail if baseline is missing/equal to current HEAD.
- Iteration 4: added per-marker gate loops, V-PROFILE stale-test update, exact reviewer/clinician sets, exact review-state mapping, and baseline/per-code final verification.
- Iteration 3: removed stale ≥1-lane launch hint and pinned V-REVIEW-05 to error, V-ATTEST-03 to warning.
- Iteration 2: tightened full 17V gate to require both view lanes, clarified view RED/GREEN vs validator RED/GREEN, added normalized rule matrix, and fixed launch-hint promotion language.
- Added explicit mitigation for missing grepable validator rule names in view tests.
- Added dirty-tree isolation requirement based on current repo status.
- Clarified handoff-vs-ADR reserved-rule discrepancy handling.
- Added concrete `$team` and `$ralph` launch hints plus verifier path.
