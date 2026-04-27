# Test Spec — a6/a7 notes TB-V validator slice


Status: Final consensus companion artifact.
## Test surface

Primary file: `src/validate.test.ts` using temp fixtures from `src/test-helpers/fixture.ts`.

## Required tests

1. `V-NOTES-01` note orphan: valid note with no communication -> hard error, `ok === false`.
2. `V-NOTES-01` comm orphan: communication `data.note_ref` to missing note -> hard error, `ok === false`.
3. Paired note+communication -> no `V-NOTES-01` error.
4. Duplicate `data.note_ref` -> no warning/error for duplicate and no later-duplicate comm orphan.
5. `rn`, `lpn`, `student_nurse` -> accepted nursing roles.
6. `rn_agent` -> excluded from nursing scope; warning-only when used in clinical/non-agent source context.
7. `nurse_practitioner` without context -> `V-NOTES-02` warning and `ok === true` absent hard errors.
8. Malformed/missing required frontmatter -> `V-NOTES-03` warning or equivalent V-NOTES warning; no V-NOTES hard error.

## Verification commands

```bash
node --test --import tsx src/validate.test.ts
npm run typecheck
npm test
npm run check
```

## Clarified assertions after Architect review

- Duplicate test must assert no duplicate warning, no duplicate error, and no claimed-body/body-resolution error.
- Malformed frontmatter tests must distinguish warning-only discoverability fields from unrelated hard schema violations.
- `rn_agent` test must assert explicit `V-NOTES-02` for clinical/non-agent source context, not author-sentinel behavior.
- NP test must assert all NP note-bearing records warn in this slice unless future HITL authorizes an allowlist.

## Additional final tests

9. Empty/missing/non-string `data.note_ref` is ignored for V-NOTES and does not produce old generic unknown-note errors.
10. AJV filtering preserves unrelated note schema errors while downgrading only `id` and `recorded_at` discoverability failures.
11. V-NOTES-02 warning cardinality is at most one warning per note pair / note-bearing communication for the same author-role concern.
