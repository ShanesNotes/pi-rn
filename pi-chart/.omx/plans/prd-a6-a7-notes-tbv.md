# PRD — a6/a7 notes TB-V validator slice


Status: Final consensus companion artifact.
## Problem

Notes are represented by Markdown bodies paired to `communication` events through `data.note_ref`. The view-only lane characterizes this substrate, but validator policy for substrate integrity and nursing scope needs executable rules.

## Goals

- Enforce V-NOTES-01 substrate integrity as a hard error.
- Surface V-NOTES-02 nursing-scope concerns as warnings.
- Capture HITL role decisions for `rn`, `lpn`, `student_nurse`, `nurse_practitioner`, and `rn_agent`.
- Preserve duplicate `note_ref` silent acceptance.
- Warn on malformed/missing required note frontmatter without turning it into a V-NOTES hard error.

## Non-goals

- No schema edits.
- No patient fixture mutations.
- No new note subtypes.
- No narrative view edits.
- No new dependencies.
- No direct SBAR/action.notification/fulfillment/attestation expansion.

## Users

- Chart maintainers who need validation reports to distinguish hard audit substrate failures from soft nursing-scope concerns.
- Future execution agents that need explicit policy boundaries.

## Requirements

1. Validator emits `V-NOTES-01` hard errors for note orphan and communication orphan states.
2. Validator emits `V-NOTES-02` warnings for nursing-scope ambiguity or excluded system-role misuse.
3. `rn`, `lpn`, and `student_nurse` are nursing-scope roles.
4. `nurse_practitioner` depends on subtype/context; absent context, warn only.
5. `rn_agent` is excluded.
6. Duplicate `data.note_ref` is not warned/errored.
7. Malformed/missing note frontmatter emits warning-only V-NOTES signal.

## Clarified policy after Architect review

- Existing generic note-pairing errors must be replaced/routed to `V-NOTES-01`.
- Duplicate `note_ref` has no warning/error and no claimed-body semantics.
- `rn_agent` must emit explicit `V-NOTES-02` warning when it appears as note/note-bearing communication author role in a clinical/non-agent source context; agent-source pi-agent notes remain excluded without warning.
- `nurse_practitioner` emits warning for every note-bearing record in this no-schema-expansion slice; no current subtype/context allowlist is authorized.
- Malformed frontmatter warning-only rows: YAML parse, no frontmatter, missing/non-string `id`, missing/invalid `recorded_at`. Other required note schema fields remain hard errors.

## Final launch boundary

Execution should use `.omx/plans/` artifacts as source of truth. Recommended mode is `$ralph .omx/plans/ralplan-a6-a7-notes-tbv.md`. Write scope is `src/validate.ts`, `src/validate.test.ts`, and final `.omx/plans/*a6-a7-notes-tbv.md` artifacts only.
