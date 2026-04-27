# Test spec — a6/a7 notes validator slice (NOTES-001)

Status: accepted
PRD: [`prd-a6-a7-notes-validator.md`](prd-a6-a7-notes-validator.md)
Implementation: `src/validate.ts`, `src/validate.test.ts`.

## Targeted verification

```bash
node --test --import tsx src/validate.test.ts
```

Expected: all `V-NOTES-*` tests pass; failure means substrate-integrity or nursing-scope policy drift.

## Regression

```bash
npm test
npm run typecheck
npm run check
```

Expected: full suite passes; typecheck clean; chart validator reports `0 error(s), 0 warning(s) across 2 patient(s)`.

## Boundary check

```bash
git diff --name-only HEAD -- src schemas patients scripts \
  | grep -vE '^src/(validate\.ts|validate\.test\.ts)$'
```

Expected: empty stdout. Any other product-root file in the diff means NOTES-001 has overstepped its boundary.

## Test coverage assertions

`src/validate.test.ts` must cover, at minimum:

1. **V-NOTES-01 note orphan** — note with no paired communication ⇒ hard error, `ok === false`.
2. **V-NOTES-01 communication orphan** — `data.note_ref` to missing note ⇒ hard error, `ok === false`.
3. **V-NOTES-01 silent for paired note + communication** — no `V-NOTES-01` error.
4. **Duplicate `data.note_ref` is silently accepted** — no warning, no error, no claimed-body / body-resolution claim.
5. **V-NOTES ignores empty / missing / non-string `note_ref`** — no `V-NOTES-*`, no generic unknown-note error.
6. **V-NOTES-02 attested nursing roles silent** — `rn`, `lpn`, `student_nurse` produce no role warning.
7. **V-NOTES-02 warns for `rn_agent` clinical context** — warning surfaces with `rn_agent` mention.
8. **V-NOTES-02 silent for `rn_agent` agent-source context** — no warning.
9. **V-NOTES-02 warns for `nurse_practitioner` ambiguity** — warning fires; validation does not fail (no hard error).
10. **V-NOTES-03 warns for missing / malformed YAML frontmatter** — warning, no hard error, file path identifiable.
11. **V-NOTES-03 downgrades `id` and `recorded_at` discoverability errors** — warning instead of hard error; AJV preserves unrelated note schema errors as hard errors.
12. **V-NOTES-02 cardinality** — at most one warning per note pair / note-bearing communication for the same author-role concern.

## Forbidden surfaces (must remain absent in repo)

- New note subtypes or `intent.*` for notes.
- `data.invoked_by` or any new note→communication link kind.
- `nurse_practitioner` subtype/context allowlist.
- SBAR / `action.notification` / fulfillment / attestation expansion attributable to NOTES-001.
- Edits to `schemas/`, `patients/`, narrative views, or `package.json` attributable to this lane.

## Acceptance evidence cross-reference

PRD `prd-a6-a7-notes-validator.md` is canonical authority. Predecessor consensus artifacts at `.omx/plans/prd-a6-a7-notes-tbv.md` and `.omx/plans/test-spec-a6-a7-notes-tbv.md` remain in `.omx/` as historical record; this tracked test-spec supersedes them for governance.
