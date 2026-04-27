# ADR 015 Phase 2 — ADR 010 validator rules in `src/validate.ts`

## RALPLAN-DR Summary

### Principles

- Keep Phase 2 additive and validator-only: no schema, type, parser, view, or
  migration changes.
- Implement only the ADR 010 rules explicitly requested here:
  `V-EVIDENCE-01`, `V-EVIDENCE-02`, and `V-EVIDENCE-03`.
- Preserve existing validator behavior outside the new evidence rules,
  including `V-SRC`, `V-TIME`, `V-STATUS`, `V-INTERVAL`, and `V-FULFILL`.
- Reuse existing normalization paths in `src/evidence.ts` and existing source
  registry facts in `src/validate.ts` instead of introducing parallel logic.

### Decision Drivers

1. The repo already has the canonical source-kind registry, support traversal
   helpers, and baseline assessment-evidence validation in `src/validate.ts`.
2. `src/evidence.ts` already normalizes EvidenceRef objects and preserves
   `role` plus recursive `derived_from`, so Phase 2 can stay validator-local.
3. The user explicitly constrained this phase to `src/validate.ts` and
   `src/validate.test.ts`, with no schema/type/parser/view/migration drift.

### Viable Options

1. Use a validator-local depth cap of 8 for `V-EVIDENCE-03`.
   Pros: executable within the user-approved Phase 2 scope of
   `src/validate.ts` plus `src/validate.test.ts`, directly satisfies the
   explicit `max depth 8` requirement, and avoids widening scope into view
   code.
   Cons: deviates from the user’s preferred constant-reuse request because the
   repo does not currently expose a shared reusable depth-cap symbol.
2. Widen scope to introduce and export a shared depth-cap constant first.
   Pros: would satisfy the reuse preference literally.
   Cons: violates the user’s validator-and-tests-only scope by touching view or
   shared support code outside this phase.
3. Defer `V-EVIDENCE-03` until a shared constant exists.
   Pros: avoids the reuse conflict.
   Cons: fails the user’s explicit requirement that Phase 2 implement all three
   ADR 010 validator rules now.

### Invalidation rationale for rejected option

- The widened-scope shared-constant option is rejected because current repo
  inspection found only a local `const depth = params.depth ?? 3` inside
  `src/views/evidenceChain.ts`; creating a shared export would broaden this
  phase beyond the user-approved validator/test boundary.
- The deferral option is rejected because the user explicitly required
  `V-EVIDENCE-03` in this phase. Deferral would leave the plan non-executable.
- Phase 2 therefore chooses the validator-local depth cap of 8, with an
  explicit ADR note that the constant-reuse preference is not currently
  satisfiable without widening scope.

## Requirements Summary

- Add `V-EVIDENCE-01` as a warning only for this predicate:
  `source.kind` is in the agent family using the existing
  `SOURCE_KIND_CANONICAL` registry (`kind` starts with `agent_`) AND
  `certainty === "inferred"` AND `type === "assessment"`.
- In that predicate only, bare-string `links.supports[]` entries warn; every
  support item must otherwise be object-form EvidenceRef. Warning message must
  be exactly:
  `V-EVIDENCE-01: agent-inferred assessment must use object-form EvidenceRef; got bare string at supports[{i}]: {value}.`
- Add `V-EVIDENCE-02` as an error enforcing at most one
  `role === "primary"` across object-form `links.supports[]`; ignore bare
  strings for this rule. Error message must be exactly:
  `V-EVIDENCE-02: multiple role:primary entries in supports (found {n}); split into separate assessments.`
- Add `V-EVIDENCE-03` as an error enforcing `derived_from` acyclicity and max
  depth 8 using a validator-local cap because no shared exported evidence-chain
  depth-cap constant exists in the repo today.
- For `V-EVIDENCE-03`, define cycle identity as normalized `kind + ref`.
- For `V-EVIDENCE-03`, define depth counting explicitly:
  outer support ref is depth 0, first `derived_from[*]` is depth 1, depth 8
  passes, depth 9 errors.
- `V-EVIDENCE-03` cycle message must be exactly:
  `V-EVIDENCE-03: derived_from cycle detected at {kind}:{ref}.`
- `V-EVIDENCE-03` depth message must be exactly:
  `V-EVIDENCE-03: derived_from depth exceeds max 8 at depth {depth} for {kind}:{ref}.`
- Do not add ADR 009 or ADR 011 rules in this phase.
- Do not change existing `V-SRC`, `V-TIME`, `V-STATUS`, `V-INTERVAL`, or
  `V-FULFILL` behavior.
- Do not change view behavior or support-resolution behavior for external refs;
  structurally valid external refs continue to bypass local supports-target
  resolution.
- Add positive, negative, and edge-case coverage for all three rules in
  `src/validate.test.ts`.
- Verification remains:
  `npm test`, `npm run check`, `npm run typecheck`, and a final grep boundary
  check.

## Implementation Plan

1. Validator rule insertion in `src/validate.ts`
   - Keep `checkSupportsTargets` unchanged.
   - Extend the existing per-envelope logic inside `checkReferentialIntegrity`
     by calling one local helper such as `validateEvidenceRules(...)` after
     `supports` extraction and target checks, keeping all current referential
     checks intact.
   - Add a small helper that identifies the `V-EVIDENCE-01` predicate using the
     existing `SOURCE_KIND_CANONICAL` data plus `kind.startsWith("agent_")`,
     `certainty === "inferred"`, and `type === "assessment"`.
   - Iterate `supports` with stable indexes so the warning message can emit
     `supports[{i}]` exactly.
2. `V-EVIDENCE-01` warn-only enforcement
   - For predicate-matching assessment events, warn on each bare string support
     entry and leave object-form refs untouched.
   - Keep the warning scoped strictly to that predicate; do not generalize bare
     string deprecation to other event shapes.
   - Preserve structural validity and downstream target resolution for the same
     event so this stays additive-only.
3. `V-EVIDENCE-02` primary-role enforcement
   - Reuse `parseEvidenceRef(raw)` for object entries, inspect normalized
     `role`, and count only `role === "primary"` on structured refs.
   - Ignore bare strings completely for this rule.
   - Emit the exact error message:
     `V-EVIDENCE-02: multiple role:primary entries in supports (found {n}); split into separate assessments.`
     when more than one primary support exists on a single event.
4. `V-EVIDENCE-03` `derived_from` traversal
   - Traverse `derived_from` only on parsed object-form refs that preserve it
     today via `src/evidence.ts`.
   - Detect cycles by normalized identity `kind + ref` along the current
     recursion path and reject any cycle in the chain with exact message:
     `V-EVIDENCE-03: derived_from cycle detected at {kind}:{ref}.`
   - Enforce a validator-local max depth of 8 with explicit counting:
     outer support ref depth 0, first `derived_from[*]` depth 1, depth 8
     passes, depth 9 errors.
   - Emit the exact depth error message:
     `V-EVIDENCE-03: derived_from depth exceeds max 8 at depth {depth} for {kind}:{ref}.`
   - Record in code comments and final report that this local cap is a scoped
     deviation from the user’s reuse preference because the repo currently does
     not expose a reusable shared constant.
   - Keep external refs structurally valid: they participate in
     `derived_from` structure checks if present but still bypass local
     supports-target resolution.
5. Test additions in `src/validate.test.ts`
   - Add positive cases proving no new evidence warnings/errors for compliant
     object-form agent-inferred assessments.
   - Add negative cases for bare-string warnings under `V-EVIDENCE-01`,
     multiple-primary rejection under `V-EVIDENCE-02`, cycle rejection under
     `V-EVIDENCE-03`, and depth-over-8 rejection under `V-EVIDENCE-03`.
   - Add edge cases proving:
     bare strings are ignored by `V-EVIDENCE-02`,
     non-agent or non-inferred or non-assessment events do not trigger
     `V-EVIDENCE-01`,
     depth 8 is accepted while depth 9 rejects,
     and external refs remain structurally acceptable without local target
     lookup failures.
   - Ensure `V-EVIDENCE-03` cycle/depth tests do not accidentally fail the
     existing assessment evidence rule by either preserving one valid
     observation/vitals/artifact support or using a non-assessment event for
     those cases.
6. Verification and boundary proof
   - Run `npm test`.
   - Run `npm run check`.
   - Run `npm run typecheck`.
   - Run `git diff --name-only -- src/validate.ts src/validate.test.ts` and
     confirm those are the only changed tracked files for the phase.
   - Run `git diff --name-only` and confirm no schema, type, parser, view, or
     migration files changed.
   - Run final grep boundary checks proving no ADR 009/011 rule codes landed
     and no unrelated validator families changed, for example by checking that
     only `V-EVIDENCE-01|V-EVIDENCE-02|V-EVIDENCE-03` were added and no new
     `V-TRANSFORM|V-CONTRA|V-RESOLVES` strings appear.

## Acceptance Criteria

- `src/validate.ts` contains only the additive Phase 2 ADR 010 validator logic
  for `V-EVIDENCE-01`, `V-EVIDENCE-02`, and `V-EVIDENCE-03`.
- `V-EVIDENCE-01` warns only for agent-family inferred assessments with
  bare-string support items, and the warning text matches the user-provided
  message format.
- `V-EVIDENCE-02` errors when more than one object-form support has
  `role === "primary"` and ignores bare strings, using the exact required
  message text.
- `V-EVIDENCE-03` errors on any cyclic `derived_from` chain using normalized
  `kind + ref` identity and on chains that exceed depth 8, using the exact
  required cycle/depth message shapes.
- `V-EVIDENCE-03` depth counting is explicit and tested:
  root support depth 0, first derived node depth 1, depth 8 passes, depth 9
  errors.
- Existing local support resolution rules remain unchanged for strings,
  note/event/artifact refs, vitals-window refs, and external refs.
- No schema, type, parser, view, or migration files are changed.
- `src/validate.test.ts` covers positive, negative, and edge behavior for all
  three rules.
- `npm test`, `npm run check`, and `npm run typecheck` all pass.
- Final boundary proof confirms only `src/validate.ts` and
  `src/validate.test.ts` changed, no new ADR 009/011 rule codes landed, and no
  unintended changes to `V-SRC`, `V-TIME`, `V-STATUS`, `V-INTERVAL`, or
  `V-FULFILL`.

## Risks And Mitigations

- Risk: `V-EVIDENCE-01` accidentally warns on non-agent or non-assessment
  events.
  Mitigation: gate the rule through one dedicated predicate helper and add
  explicit non-trigger tests for each branch.
- Risk: `V-EVIDENCE-02` counts bare strings or malformed refs.
  Mitigation: count only parsed object refs with normalized `role`, and add
  mixed bare-string/object edge tests.
- Risk: `V-EVIDENCE-03` depth/cycle traversal diverges from existing evidence
  semantics.
  Mitigation: reuse `parseEvidenceRef` output, traverse only normalized
  `derived_from`, and keep the algorithm local to validator semantics.
- Risk: the user requested reuse of an existing evidence-chain depth-cap
  constant, but current repo inspection found none.
  Mitigation: Phase 2 explicitly chooses a validator-local cap of 8 because the
  user also constrained this phase to validator plus tests only. The ADR and
  final report must call this out as a justified scope-preserving deviation.
- Risk: external refs get pulled into local target-id checks.
  Mitigation: keep `resolveSupportsObject` external-ref bypass unchanged and
  scope new logic to structural role/chain checks only.
- Risk: cycle/depth tests fail for the wrong reason because assessments still
  require valid observation evidence.
  Mitigation: preserve one valid evidence support in those fixtures or use
  non-assessment events for isolated `V-EVIDENCE-03` tests.

## ADR

### Decision

Implement ADR 015 Phase 2 as a validator-only addition in `src/validate.ts`
with matching tests in `src/validate.test.ts`, using a validator-local
`derived_from` max-depth cap of 8.

### Drivers

- user scope lock to validator plus tests only
- existing validator helpers already own support traversal and assessment logic
- `src/evidence.ts` already preserves the normalized fields needed for ADR 010
- no shared exported evidence-chain depth-cap constant exists in the repo today

### Alternatives considered

- validator-local depth cap 8
- widen scope to export or introduce shared depth-cap plumbing first
- defer `V-EVIDENCE-03`

### Why chosen

- It is the smallest change surface that can fully implement the requested
  rules while preserving earlier Phase 1 behavior.
- It is the only fresh-session-executable path that satisfies the user’s
  explicit `max depth 8` requirement without violating the validator/test-only
  scope.

### Consequences

- Phase 2 remains narrowly reviewable and should touch only two files:
  `src/validate.ts` and `src/validate.test.ts`.
- The plan intentionally deviates from the user’s preferred constant-reuse
  request because repo-grounded inspection does not show a reusable shared
  constant and creating one would widen scope beyond this phase.

### Follow-ups

- Later ADR 015 phases can add ADR 009/011 validator rules separately without
  reopening these tests.
- If reviewers later want true shared depth-cap reuse, that refactor should be
  handled explicitly in a separate scoped change rather than folded into this
  validator-only phase.

## Copy-paste ready fresh-session prompt

```text
Implement ADR 015 Phase 2 as a validator-only change. Modify only `src/validate.ts` and `src/validate.test.ts`.

Scope:
- Add V-EVIDENCE-01 (warning) to `src/validate.ts`.
- Add V-EVIDENCE-02 (error) to `src/validate.ts`.
- Add V-EVIDENCE-03 (error) to `src/validate.ts`.
- Add positive / negative / edge tests for all three rules in `src/validate.test.ts`.

Hard constraints:
- No schema, type, parser, view, or migration changes.
- No ADR 009 or ADR 011 rule logic in this phase.
- Do not change existing V-SRC / V-TIME / V-STATUS / V-INTERVAL / V-FULFILL behavior.
- External refs remain structurally valid and must continue to bypass local supports-target resolution.
- Keep `checkSupportsTargets` unchanged.
- Add one local helper such as `validateEvidenceRules(...)` and call it from `checkReferentialIntegrity` after support extraction and target checks.

Rule details:
- V-EVIDENCE-01 predicate is exactly:
  source.kind is an agent-family value using the existing canonical source-kind registry (`SOURCE_KIND_CANONICAL`) and prefixed `agent_`
  AND certainty === "inferred"
  AND type === "assessment".
- In that predicate only, every `links.supports[]` item must be object-form EvidenceRef.
- Bare strings warn only here, with exact message:
  `V-EVIDENCE-01: agent-inferred assessment must use object-form EvidenceRef; got bare string at supports[{i}]: {value}.`
- V-EVIDENCE-02: at most one object-form support may have `role === "primary"`. Ignore bare strings. Exact message:
  `V-EVIDENCE-02: multiple role:primary entries in supports (found {n}); split into separate assessments.`
- V-EVIDENCE-03: `derived_from` chains must be acyclic and max depth 8.
- V-EVIDENCE-03 cycle identity is normalized `kind + ref`.
- V-EVIDENCE-03 depth counting is explicit: root support depth 0, first `derived_from[*]` depth 1, depth 8 passes, depth 9 errors.
- V-EVIDENCE-03 cycle message:
  `V-EVIDENCE-03: derived_from cycle detected at {kind}:{ref}.`
- V-EVIDENCE-03 depth message:
  `V-EVIDENCE-03: derived_from depth exceeds max 8 at depth {depth} for {kind}:{ref}.`

Implementation guidance:
- Reuse the existing `SOURCE_KIND_CANONICAL` set in `src/validate.ts`.
- Reuse `parseEvidenceRef` normalization from `src/evidence.ts`.
- Keep the current referential-integrity / support-resolution behavior intact.
- Keep `checkSupportsTargets` unchanged and add a local evidence-rules helper call after target checks.
- Use a validator-local max depth of 8 for `V-EVIDENCE-03`. This is an explicit, justified deviation from the user’s constant-reuse preference because current repo inspection found only `src/views/evidenceChain.ts` local default `const depth = params.depth ?? 3` and no shared exported reusable cap.

Tests to add:
- Positive compliant agent-inferred assessment with object-form refs.
- Negative V-EVIDENCE-01 bare-string warning.
- Negative V-EVIDENCE-02 multiple-primary error.
- Negative V-EVIDENCE-03 cycle error.
- Negative V-EVIDENCE-03 depth > 8 error.
- Edge tests proving:
  bare strings are ignored by V-EVIDENCE-02,
  non-agent / non-inferred / non-assessment cases do not trigger V-EVIDENCE-01,
  depth 8 passes and depth 9 fails,
  structurally valid external refs still bypass local supports-target resolution.
- Make V-EVIDENCE-03 cycle/depth fixtures avoid false failures from the
  existing assessment-evidence rule by preserving one valid observation/vitals/artifact support or by using a non-assessment event.

Verification:
- `npm test`
- `npm run check`
- `npm run typecheck`
- `git diff --name-only -- src/validate.ts src/validate.test.ts`
- `git diff --name-only`
- grep proof that only `V-EVIDENCE-01|V-EVIDENCE-02|V-EVIDENCE-03` were added and no `V-TRANSFORM|V-CONTRA|V-RESOLVES` codes landed
- grep proof that no unintended edits to `V-SRC|V-TIME|V-STATUS|V-INTERVAL|V-FULFILL` logic landed

Commit message:
- `Phase 2 — ADR 010 validator (V-EVIDENCE-01..03) (ADR 015)`
```
