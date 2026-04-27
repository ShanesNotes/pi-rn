# Deep Interview Context Snapshot — a6/a7 notes translation HITL

- Created: 20260426T185515Z
- Task slug: `a6-a7-notes-translation-hitl`
- Source plan: `/home/ark/.claude/plans/ralplan-a6-a7-notes-translation.md`
- Context type: brownfield
- Prompt-safe initial-context summary status: recorded

## Task statement
Resolve the human-in-the-loop decisions remaining after the final ralplan for the a6/a7 notes translation lane.

## Desired outcome
Produce execution-ready policy decisions for the follow-up TB-V validator slice while preserving the final ADR for the current view-only lane.

## Stated solution
The final ADR chooses OPTION A: a single combined view-only `notes()` lane for the audit/discoverability invariant. Owned files for the implementation lane are `src/views/notes.ts`, `src/views/notes.test.ts`, and a re-export-only edit to `src/views/index.ts`.

## Probable intent hypothesis
The user wants the remaining HITL decisions turned into explicit validator policy so the later TB-V slice can proceed without smuggling clinical scope, severity, or malformed-fixture assumptions into code.

## Known facts/evidence
- `src/views/notes.ts` and `src/views/notes.test.ts` do not currently exist.
- `src/views/index.ts` is the view barrel export surface.
- `src/views/narrative.ts` currently pairs Markdown notes with `communication.data.note_ref` using Map insertion over loaded events; the final plan deliberately diverges in `notes.ts` by sorting communications by `recorded_at` ASC before indexing.
- The plan seeds `NURSING_AUTHOR_ROLES = new Set(["rn"])` only and defers `lpn`, `student_nurse`, and `nurse_practitioner` to HITL.

## Constraints
- TB-style boundary.
- No `validate.ts`, no schemas, no `patients/` mutation, no `narrative.ts` edits, no new dependencies for the view-only lane.
- Notes remain Markdown body + `communication` envelope paired by `data.note_ref`.
- `rn_agent` remains excluded as a pi-agent system role, not a clinical author role.

## Unknowns/open questions
1. Nursing-role membership: whether `lpn`, `student_nurse`, and/or `nurse_practitioner` join nursing scope.
2. Rule shape: whether V-NOTES-01 and V-NOTES-02 are hard errors or warnings.
3. Duplicate `note_ref` policy: accept first-wins, warn, or reject.
4. Malformed-note frontmatter policy: silently skip or warn.

## Decision-boundary unknowns
- Which validator severities OMX may implement without additional confirmation.
- Which clinical author roles may be treated as nursing scope without overstepping HITL.
- Whether corrupt substrate states should block or merely surface warnings.

## Likely codebase touchpoints
- Current lane: `src/views/notes.ts`, `src/views/notes.test.ts`, `src/views/index.ts`.
- Follow-up validator lane: likely `src/validate.ts` and validation tests, but not in current view-only implementation.

## Interview status
- Profile: standard
- Initial ambiguity estimate: 0.32
- Threshold: 0.20
- Current focus: decision boundaries / validator severity
