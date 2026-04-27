# RALPLAN — a6/a7 notes TB-V validator slice

Status: Final consensus plan. Architect approved after one iteration; Critic approved with notes applied. Source requirements: `.omx/specs/deep-interview-a6-a7-notes-translation-hitl.md` and prior final view-only ADR at `/home/ark/.claude/plans/ralplan-a6-a7-notes-translation.md`.

## Requirements Summary

Plan the TB-V validator follow-up for a6/a7 notes after the view-only `notes()` lane. The validator must make note audit/discoverability policy enforceable without expanding schemas/subtypes or changing patient fixtures.

Binding HITL decisions from the deep-interview spec:

| Issue | Binding decision |
|---|---|
| V-NOTES-01 substrate integrity | Hard error |
| V-NOTES-02 nursing scope | Warning, not blocking |
| `rn` | Nursing scope |
| `lpn` | Nursing scope |
| `student_nurse` | Nursing scope |
| `nurse_practitioner` | Conditional; in this no-schema-expansion slice, warn for every NP note-bearing record because no subtype/context allowlist is authorized |
| `rn_agent` | Excluded; pi-agent system role; V-NOTES-02 warns only when used in clinical/non-agent note context |
| Duplicate `data.note_ref` | Accepted silently; preserve earliest-`recorded_at` first-wins projection behavior |
| Malformed/missing required note frontmatter | Validator warning; view may keep silent skip behavior |

## Brownfield Evidence

- Validator state already tracks `noteIds` and `communicationNoteRefs` in `src/validate.ts:63-69`, initialized in `src/validate.ts:895-900`.
- Errors/warnings are emitted through `err`/`warn` at `src/validate.ts:78-82`; coded rules use `ruleErr`/`ruleWarn` at `src/validate.ts:428-433`.
- `validateChart` runs timeline validation, then referential integrity, then existing note↔communication checks at `src/validate.ts:983-999`, returning `ok` from error count at `src/validate.ts:1004-1007`.
- Event scanning records any string `communication.data.note_ref` in `src/validate.ts:1137-1140`.
- Note validation parses frontmatter and currently hard-errors parse/no-frontmatter/schema failures in `src/validate.ts:1188-1216`; valid note ids are added at `src/validate.ts:1242-1246`.
- Existing comm→note hard error is at `src/validate.ts:1488-1492`.
- `parseFrontmatter` returns `[null, text]` for absent/incomplete frontmatter and throws on non-mapping YAML at `src/fs-util.ts:29-40`.
- `globNotes` enumerates timeline note Markdown files in deterministic day/file order at `src/fs-util.ts:99-122`.
- `narrative()` skips malformed notes and indexes communication events by first Map insertion, not `recorded_at`, at `src/views/narrative.ts:29-48` and `src/views/narrative.ts:66-77`.
- Temp test fixtures are available via `makeEmptyPatient`, `appendRawEvent`, and `writeRawNote` at `src/test-helpers/fixture.ts:16-36`, `src/test-helpers/fixture.ts:47-58`, and `src/test-helpers/fixture.ts:73-87`.
- Test and verification scripts are `npm test`, `npm run typecheck`, and `npm run check` from `package.json:17-18` and `package.json:9-11`.
- No existing `V-NOTES` rule is present.

## RALPLAN-DR Summary

### Principles

1. **Validator policy follows the HITL matrix exactly.** Do not silently upgrade warnings to errors or broaden nursing roles beyond the spec.
2. **Substrate integrity is stricter than semantic scope.** Missing body/envelope breaks auditability and is hard; nursing-scope ambiguity is surfaced as warning.
3. **No schema/subtype expansion in this slice.** Use existing event/note fields and local validator logic.
4. **Do not mutate canonical patients.** Tests use temp fixtures only.
5. **Minimize drift with views without over-extracting.** Preserve `notes.ts` earliest-recorded-at semantics; avoid modifying `narrative.ts` unless helper extraction is explicitly chosen and tested.

### Decision Drivers

1. **Severity correctness** — V-NOTES-01 must fail validation; V-NOTES-02 and malformed frontmatter must warn.
2. **Blast-radius control** — `src/validate.ts` and `src/validate.test.ts` should be the primary TB-V files; helper extraction only if it reduces duplication without touching current view contracts.
3. **Future reconciliation seam** — duplicate `note_ref` remains silently accepted, so tests must prevent accidental warning/error behavior while preserving deterministic first-wins projection semantics.

### Viable Options

#### Option A — Validator-local TB-V rules (recommended)

Add notes-specific validator state and functions in `src/validate.ts`, with tests in `src/validate.test.ts`. Keep pairing logic local to validation for now; do not edit `narrative.ts`. If `src/views/notes.ts` exists by execution time, optionally import only stable exported role constants if no cycle is introduced; otherwise duplicate a tiny validator-local role policy with a comment pointing to the HITL spec.

Pros:
- Smallest implementation blast radius.
- Directly fits existing `ruleErr`/`ruleWarn` conventions.
- Does not force helper extraction before the view-only lane lands.
- Avoids accidental changes to `narrative()` semantics.

Cons:
- Pairing policy remains duplicated until a later extraction lane.
- Validator-local role policy can drift from `notes.ts` if both evolve independently.

#### Option B — Shared pairing helper now

Create a shared helper, e.g. `src/notes-pairing.ts`, used by `src/views/notes.ts` and `src/validate.ts`; optionally later adapt `narrative.ts`.

Pros:
- Stronger anti-drift posture for V-NOTES-01 and `notes()`.
- Cleaner future reuse for additional note lanes.

Cons:
- Higher coordination cost because `src/views/notes.ts` may not exist yet.
- If `narrative.ts` is touched now, it violates the prior view-only lane boundary and risks changing reader behavior.
- More files and tests before the validator policy is proven.

#### Option C — Validator policy doc only

Record TB-V decisions in docs/plan but defer implementation.

Pros:
- Zero code risk.
- Useful if current view-only lane has not landed.

Cons:
- Does not produce executable enforcement.
- Repeats the deep-interview artifact without advancing TB-V.

### Recommended Choice

Option A. It creates executable validator behavior with narrow blast radius. It leaves helper extraction as a follow-up once both `notes.ts` and validator behavior exist and can be reconciled from tests.

## Planned Files

Primary TB-V implementation:

- `src/validate.ts` — add V-NOTES state, helper functions, and rules.
- `src/validate.test.ts` — add V-NOTES temp-fixture tests.

Planning artifacts:

- `.omx/plans/prd-a6-a7-notes-tbv.md`
- `.omx/plans/test-spec-a6-a7-notes-tbv.md`
- `.omx/plans/ralplan-a6-a7-notes-tbv.md`

Forbidden unless a later approved lane says otherwise:

- `schemas/**`
- `patients/**`
- `src/views/narrative.ts`
- new dependencies
- note subtype additions

Conditional:

- `src/views/notes.ts` only if execution also owns the view-only lane or the file already exists and exposes a stable constant that can be reused without coupling.

## Implementation Plan

### Step 1 — Add note audit state without changing global validation flow

Extend `State` in `src/validate.ts:63-76` with enough metadata to evaluate note substrate after timeline scan:

- `notesById: Map<string, NoteValidationRecord[]>`
- `communicationsByNoteRef: Map<string, CommunicationNoteRefRecord[]>`
- `malformedNotes: MalformedNoteRecord[]`

Collect records where validation already reads events and notes:

- In event scanning near `src/validate.ts:1137-1140`, record communication id, where, `recorded_at`, author role, subtype, and `data.note_ref` only when `note_ref` is a non-empty string.
- In note validation near `src/validate.ts:1188-1246`, record parse failures, absent frontmatter, non-string/missing `id`, and missing/malformed `recorded_at` into `malformedNotes` as warnings-to-emit later.
- Keep duplicate `note_ref` collection as a list, not a Set, so first-wins can be reasoned about without warning/error.

### Step 2 — Replace/route existing bidirectional note checks into V-NOTES-01

Current validator already hard-errors note-without-communication at `src/validate.ts:989-997` and comm-without-note at `src/validate.ts:1488-1492`. Move these into a single notes validation phase after `checkReferentialIntegrity(state)` at `src/validate.ts:986-987` and before return.

Target behavior:

- `V-NOTES-01` hard error when a parseable note id has no matching non-empty `communication.data.note_ref`.
- `V-NOTES-01` hard error when a non-empty string `communication.data.note_ref` points to no parseable note id.
- Fully replace/reroute the existing generic note-pairing messages at `src/validate.ts:989-998` and `src/validate.ts:1488-1492`; after this slice, note/body envelope pairing failures must carry `V-NOTES-01`.
- Empty/missing/non-string `note_ref` is not a note-bearing communication and is ignored for V-NOTES.
- Duplicate `note_ref` never warns/errors. There is no “claimed body” validator semantics: if two communications point to one valid note id, both resolve to an existing body for validation purposes. Earliest `recorded_at` remains only the projection/view tie-break concept and is not enforced as a duplicate warning/error.

Implementation shape:

```ts
function validateNotesRules(state: State) {
  validateNotesSubstrateIntegrity(state); // V-NOTES-01 hard errors
  validateNursingScopeWarnings(state);    // V-NOTES-02 warnings
  validateMalformedNoteWarnings(state);   // V-NOTES-03 warnings, if named
}
```

Use `ruleErr`/`ruleWarn` for messages so tests can assert `V-NOTES-*` codes.

### Step 3 — Add nursing-scope warnings as V-NOTES-02

Define local constants in `src/validate.ts` near other rule constants:

```ts
const NURSING_AUTHOR_ROLES = new Set(["rn", "lpn", "student_nurse"]);
const CONDITIONAL_NURSING_AUTHOR_ROLES = new Set(["nurse_practitioner"]);
```

Rules:

- `rn`, `lpn`, `student_nurse` are nursing-scope by role.
- `rn_agent` is never nursing-scope.
- `nurse_practitioner` is conditional in the HITL decision. For this no-schema-expansion slice, there is no authorized subtype/context allowlist, so every NP note-bearing record is treated as ambiguous and warning-only.
- V-NOTES-02 is warning-only; it must not affect `report.ok`.

Concrete first-pass warning contract:

- Deterministic NP policy for this no-schema-expansion slice: every note-bearing `nurse_practitioner` author emits `V-NOTES-02` warning for nursing/provider ambiguity. No current field value is allowlisted as explicit nursing context in this slice. A future subtype/context lane may replace this with an allowlist after HITL.
- If `rn_agent` appears as a note or note-bearing communication `author.role` in a clinical/non-agent source context, emit an explicit `V-NOTES-02` warning and do not classify it as nursing. Pi-agent system notes with `source.kind` beginning `agent_` remain excluded without warning so existing agent-authored fixtures stay green. Do not rely on `checkAuthorSentinel`; that function only checks placeholder `author.id` values at `src/validate.ts:2445-2456`.
- `rn`, `lpn`, and `student_nurse` do not produce a V-NOTES-02 warning by role alone.
- Do not invent new subtypes or schemas.

### Step 4 — Add malformed/missing frontmatter warning policy

Current `validateNote` hard-errors parse/no-frontmatter/schema failures at `src/validate.ts:1204-1216`. Change only the frontmatter discoverability handling required by HITL. Use a distinct warning code, preferably `V-NOTES-03`, so V-NOTES-01 remains substrate pairing and V-NOTES-02 remains nursing scope.

Malformed-frontmatter severity table:

| Case | V-NOTES severity | Generic schema behavior | Counts for V-NOTES-01 pairing? | Rationale |
|---|---|---|---|---|
| YAML parse throws in `parseFrontmatter` | `V-NOTES-03` warning | Do not also emit generic hard parse error for this same note | No; no usable `id` can be trusted | HITL says malformed frontmatter warns; view may skip. |
| No frontmatter block / unterminated block returns `fm === null` | `V-NOTES-03` warning | Do not also emit generic hard “no frontmatter block” for this same note | No | Missing envelope metadata is discoverability warning, not substrate hard error. |
| Missing/non-string `id` | `V-NOTES-03` warning | Suppress duplicate AJV required/type error for `id` only | No | Cannot pair without usable id, but HITL chose warning for malformed frontmatter. |
| Missing/invalid `recorded_at` | `V-NOTES-03` warning | Suppress duplicate AJV required/format/type error for `recorded_at` only | Yes, if `id` is usable | Pairing can still verify body/envelope by id; recorded_at affects ordering, not existence. |
| Other required fields from `schemas/note.schema.json:7-18` (`type`, `subject`, `encounter_id`, `effective_at`, `author`, `source`, `status`, `references`) | Existing schema error | Preserve existing hard schema validation | Yes, if `id` is usable | HITL only relaxed malformed/discoverability frontmatter; do not weaken unrelated note schema. |
| Unrelated schema/type violations | Existing schema error | Preserve existing hard schema validation | Yes, if `id` is usable | Keeps current validator strictness outside HITL decision. |

Avoid double-reporting the same condition as both generic hard error and V-NOTES warning when it falls in the warning-only rows. Preserve unrelated schema validation errors as hard errors.

### Step 5 — Add focused tests in `src/validate.test.ts`

Use temp fixtures only (`src/test-helpers/fixture.ts:16-87`). Add tests near existing validation-rule blocks.

Required tests:

1. **V-NOTES-01 note orphan hard error** — write Markdown note with valid `id` and no matching communication; expect `ok === false` and error containing `V-NOTES-01`.
2. **V-NOTES-01 comm orphan hard error** — communication with non-empty `data.note_ref` for missing note; expect hard error containing `V-NOTES-01`.
3. **Paired note passes substrate** — valid note + matching communication; no `V-NOTES-01` error.
4. **Duplicate note_ref accepted silently** — two communication events reference one valid note; expect no duplicate warning, no duplicate error, and no second body-resolution/claimed-body error from the later duplicate.
5. **V-NOTES-02 warning-only nursing roles** — `rn`, `lpn`, `student_nurse` are accepted nursing roles without warning for role alone.
6. **V-NOTES-02 rn_agent excluded** — `rn_agent` does not classify as nursing; in clinical/non-agent source context, expect explicit `V-NOTES-02` warning and `ok === true` absent hard errors.
7. **V-NOTES-02 NP ambiguity warning** — every `nurse_practitioner` note-bearing author emits warning in this slice and does not fail `ok`, because no subtype/context allowlist is authorized yet.
8. **V-NOTES-03 malformed frontmatter warning** — malformed/no required frontmatter produces warning containing `V-NOTES-03`, not a hard V-NOTES error.

### Step 6 — Run verification

Minimum targeted verification:

```bash
node --test --import tsx src/validate.test.ts
npm run typecheck
npm run check
```

Full regression:

```bash
npm test
```

Boundary check:

```bash
git diff --name-only -- src/validate.ts src/validate.test.ts .omx/plans/prd-a6-a7-notes-tbv.md .omx/plans/test-spec-a6-a7-notes-tbv.md .omx/plans/ralplan-a6-a7-notes-tbv.md
```

## Acceptance Criteria

- `src/validate.ts` emits `V-NOTES-01` hard errors for note orphan and communication orphan substrate failures.
- `src/validate.ts` does not warn/error for duplicate `data.note_ref`; duplicates remain silently accepted.
- `src/validate.ts` emits `V-NOTES-02` warnings, never errors, for nursing-scope ambiguity or excluded system-role misuse.
- `rn`, `lpn`, and `student_nurse` are recognized as nursing-scope roles.
- `rn_agent` is excluded from nursing scope; clinical/non-agent use warns, agent-source system notes do not.
- `nurse_practitioner` is conditional on subtype/context; this slice has no authorized allowlist, so every NP note-bearing record produces warning-only ambiguity.
- Malformed/missing note frontmatter follows the severity table: parse/no-frontmatter/missing id/missing recorded_at produce warning-only V-NOTES signals; unrelated schema violations remain existing hard errors.
- No schemas, patient fixtures, note subtypes, or dependencies are added.
- Targeted tests, full tests, typecheck, and check pass.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Existing generic note schema errors conflict with warning-only malformed policy | Use the explicit severity table: reclassify parse/no-frontmatter/`id`/`recorded_at` discoverability failures only; preserve unrelated schema errors. Add tests asserting no generic hard error for warning-only rows. |
| NP subtype/context cannot be determined with current schema | Emit V-NOTES-02 for every NP note-bearing record in this slice. Document ask-again boundary before adding any subtype/context allowlist. |
| Duplicate note_ref handling accidentally changes current hard comm orphan behavior | Store all comm refs as lists and test duplicate acceptance explicitly. |
| Drift between view pairing and validator pairing | Keep earliest-recorded-at semantics documented; schedule helper extraction after both implementations are tested. |
| Touching `narrative.ts` changes reader behavior | Forbid `narrative.ts` edits in this TB-V plan. |

## ADR

### Decision

Adopt Option A: implement TB-V notes validation locally in `src/validate.ts` with focused tests in `src/validate.test.ts`.

### Drivers

- HITL severity matrix needs executable enforcement.
- Narrow validator-local changes minimize blast radius.
- Current `notes.ts` may not exist yet, so shared helper extraction is premature for this planning handoff.

### Alternatives considered

- Option B, shared helper extraction now: rejected for timing/blast radius; useful follow-up once `notes.ts` and validator behavior both exist.
- Option C, doc-only: rejected because deep-interview already produced policy; next value is executable validation.

### Why chosen

It delivers the required hard/warn behavior in the existing validator architecture using known rule helpers and temp-fixture tests while avoiding schema, patient fixture, and narrative-view churn.

### Consequences

- Some note pairing logic remains duplicated temporarily.
- A future helper extraction should reconcile `notes.ts`, validator logic, and possibly `narrative.ts` only after tests pin the intended semantics.
- Existing generic note-schema behavior may need careful narrowing to satisfy the malformed-frontmatter warning policy.

### Follow-ups

1. Extract `pairNotesWithCommunications()` after both `notes.ts` and V-NOTES tests exist.
2. Add explicit subtype/context support for NP nursing vs provider classification if future HITL authorizes schema/subtype changes.
3. Consider SBAR section addressability and action.notification chain in separate lanes.

## Available-Agent-Types Roster

Recommended available roles from the current catalog:

- `explore` — fast repo lookup and line mapping.
- `planner` — plan revisions and sequencing.
- `architect` — architecture review and boundary tradeoffs.
- `critic` — plan quality and acceptance criteria review.
- `executor` — implementation in `src/validate.ts` / `src/validate.test.ts`.
- `test-engineer` — targeted validator test design.
- `verifier` — completion evidence and regression validation.
- `build-fixer` — typecheck/test/build failures.
- `code-reviewer` — final comprehensive review.
- `security-reviewer` — not primary; optional because clinical substrate integrity matters but no auth/security surface changes.

## Follow-up Staffing Guidance

### `$ralph` path

Use one persistent executor with reviewer support:

- Primary: `executor` with medium reasoning for `src/validate.ts` and `src/validate.test.ts`.
- Sidecar if stuck: `test-engineer` with medium reasoning for warning/error test shape.
- Final: `verifier` with high reasoning for rule-code evidence and command output.

Suggested invocation:

```bash
$ralph .omx/plans/ralplan-a6-a7-notes-tbv.md
```

### `$team` path

Use team only if the implementation expands beyond the two expected code files:

- Lane 1: `executor` owns `src/validate.ts`.
- Lane 2: `test-engineer` owns `src/validate.test.ts`.
- Lane 3: `verifier` owns verification commands and boundary checks.
- Optional lane 4: `build-fixer` only after a failing typecheck/test output exists.

Launch hints:

```bash
$team .omx/plans/ralplan-a6-a7-notes-tbv.md
# or, from shell if using OMX tmux runtime directly:
omx team --plan .omx/plans/ralplan-a6-a7-notes-tbv.md
```

Team verification path:

1. Team proves targeted validator tests pass.
2. Team proves `npm run typecheck`, `npm test`, and `npm run check` pass or reports exact blockers.
3. Ralph/verifier handoff checks final diff scope and verifies no schemas/patients/narrative/dependencies changed.

## Draft Changelog

- Initial consensus draft created from deep-interview HITL spec and repo evidence.

## Architect Iteration Changelog

- Added required malformed-frontmatter severity table covering YAML parse, no frontmatter, `id`, `recorded_at`, other required note fields, and unrelated schema violations.
- Required current generic note-pairing errors to be fully routed through `V-NOTES-01`.
- Tightened duplicate `note_ref` policy: no duplicate warning/error and no claimed-body semantics.
- Made clinical-context `rn_agent` an explicit `V-NOTES-02` warning, not an author-sentinel side effect; agent-source `rn_agent` remains excluded without warning to preserve green live fixtures.
- Made `nurse_practitioner` deterministic for this slice: warn for every note-bearing NP record until a future subtype/context allowlist is authorized.

## Critic Approval Notes Applied

- Added final launch/staffing guidance with solo/Ralph recommendation and bounded write scope.
- Added explicit instruction to promote `.omx/drafts/` artifacts to `.omx/plans/` before execution.
- Added empty/missing/non-string `data.note_ref` test requirement.
- Added AJV filtering seam: filter `noteValidator.errors` before `ajvErrorsTo()` so only `id` and `recorded_at` required/type/format failures are downgraded.
- Clarified warning cardinality: V-NOTES-02 emits at most one warning per note pair / note-bearing communication author role concern.

## Final Launch / Staffing Section

Recommended execution mode: **Ralph single-owner loop** or solo executor. Team mode is not needed unless implementation collides with the separate view-only notes lane or expands beyond the expected two source files.

Final write scope for execution:

- `src/validate.ts`
- `src/validate.test.ts`
- `.omx/plans/ralplan-a6-a7-notes-tbv.md`
- `.omx/plans/prd-a6-a7-notes-tbv.md`
- `.omx/plans/test-spec-a6-a7-notes-tbv.md`

Do not edit:

- `schemas/**`
- `patients/**`
- `src/views/narrative.ts`
- package dependencies

Finalization instruction: before execution, use the promoted `.omx/plans/` files as source of truth, not the `.omx/drafts/` copies.

Recommended command:

```bash
$ralph .omx/plans/ralplan-a6-a7-notes-tbv.md
```

Team fallback only if coordination is needed:

```bash
$team .omx/plans/ralplan-a6-a7-notes-tbv.md
# shell runtime alternative:
omx team --plan .omx/plans/ralplan-a6-a7-notes-tbv.md
```

## Final Implementation Clarifications

### Empty/missing/non-string note_ref

Add a test proving communications with missing `data.note_ref`, empty-string `data.note_ref`, or non-string `data.note_ref` are ignored for V-NOTES and do not produce old generic unknown-note errors. They are not note-bearing communications.

### AJV filtering seam

When downgrading warning-only malformed-frontmatter fields, filter raw `noteValidator.errors` before `ajvErrorsTo()`. Downgrade only:

- `required` for missing `id`
- `type` for non-string `id`
- `required` for missing `recorded_at`
- `type` / `format` for invalid `recorded_at`

Preserve every unrelated AJV error as an existing hard schema error.

### V-NOTES-02 warning cardinality

Emit at most one `V-NOTES-02` warning per note pair / note-bearing communication for each author-role concern:

- Paired note + communication with the same `nurse_practitioner` role: one NP ambiguity warning.
- Paired note + communication with the same `rn_agent` role in clinical/non-agent source context: one rn_agent exclusion warning.
- If note and communication disagree and independently trigger different role concerns, emit one warning per distinct concern with clear `where`.
