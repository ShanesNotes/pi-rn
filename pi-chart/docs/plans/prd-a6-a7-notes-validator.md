# PRD — a6/a7 notes validator slice (NOTES-001)

## Status and authority

- Board card: `NOTES-001`
- Status: **accepted (2026-04-26)** — legitimizing already-on-disk validator implementation in `src/validate.ts` + `src/validate.test.ts`.
- HITL disposition source: [`memos/hitl-decisions-26042026.md`](../../memos/hitl-decisions-26042026.md) #5 — operator chose "a6/a7 notes (combined)" with TB-style boundary discipline.
- Predecessor planning surface: [`.omx/plans/prd-a6-a7-notes-tbv.md`](../../.omx/plans/prd-a6-a7-notes-tbv.md) and [`.omx/plans/test-spec-a6-a7-notes-tbv.md`](../../.omx/plans/test-spec-a6-a7-notes-tbv.md) (final consensus companion artifacts; their content is promoted into this tracked surface).
- Source authority: [`clinical-reference/phase-a/a6-provider-notes-council-synthesis.md`](../../clinical-reference/phase-a/a6-provider-notes-council-synthesis.md), [`clinical-reference/phase-a/a7-nursing-notes-council-synthesis.md`](../../clinical-reference/phase-a/a7-nursing-notes-council-synthesis.md), and accepted-direction anchors merged into [`clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`](../../clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md).
- Successor authority for any future translation/view work: this PRD plus a future HITL gate.

## Why this lane exists

Notes are represented by Markdown bodies paired to `communication` events through `data.note_ref`. PHA-001 left validator-policy enforcement of that substrate deferred. The implementation that enforces the substrate plus nursing-scope role discipline landed on disk via a `.omx/plans/` consensus pass but was never legitimized in tracked planning. This PRD converts the on-disk lane into an accepted card without changing implementation.

## Implemented surface (already on disk)

| File | Role | Boundary |
|---|---|---|
| `src/validate.ts` (delta) | Adds `validateNotesRules`, `validateNotesSubstrateIntegrity`, `validateNursingScopeWarnings`, AJV warning-only filtering for note frontmatter discoverability fields, `NURSING_AUTHOR_ROLES` / `CONDITIONAL_NURSING_AUTHOR_ROLES` taxonomy, and `notesById` / `communicationsByNoteRef` state surfaces. Emits `V-NOTES-01` (hard error), `V-NOTES-02` (warning), `V-NOTES-03` (warning). | No schema edits; no patient fixture mutation; no narrative view edits; no new note subtype. |
| `src/validate.test.ts` (delta) | Adds the 11-test contract from the predecessor test-spec covering V-NOTES-01 / V-NOTES-02 / V-NOTES-03 plus duplicate-tolerance and missing/empty/non-string `note_ref` paths. | View-only test surface; uses temp fixtures via existing helpers. |

## Boundaries (inherited from PHA-001 + memo #5)

- **No schema edits.** No edits to `schemas/event.schema.json` or `schemas/profiles/`.
- **No patient fixture mutation.** No edits to `patients/`.
- **No new note subtypes.** Notes stay paired through `data.note_ref`.
- **No narrative view edits.** This lane is validator-only; future view work is a separate lane.
- **No new dependencies.** `package.json` / `package-lock.json` untouched.
- **No SBAR / `action.notification` / fulfillment / attestation expansion.** Out of scope per memo.
- **Invariant 10 fidelity.** Nursing-scope `assessment.*` may support / address / interpret but never fulfill or close an intent (per `ADR017-001`); reaffirmed via `V-NOTES-02` warning surface for nursing-role ambiguity.
- **Duplicate `note_ref` is silently accepted.** No claimed-body semantics introduced in this lane.

## Acceptance criteria

- [x] `V-NOTES-01` hard errors fire on note orphan and communication-orphan-by-note-ref states.
- [x] `V-NOTES-01` stays silent for paired note + communication.
- [x] Duplicate `data.note_ref` produces no warning, no error, and no body-resolution claim.
- [x] Missing / empty / non-string `data.note_ref` is ignored for `V-NOTES` and does not produce generic unknown-note errors.
- [x] `V-NOTES-02` warning surface accepts `rn` / `lpn` / `student_nurse` silently in nursing-scope roles.
- [x] `V-NOTES-02` warns for `rn_agent` used as clinical/non-agent-source nursing author role.
- [x] `V-NOTES-02` stays silent for `rn_agent` in agent-source note context.
- [x] `V-NOTES-02` warns for `nurse_practitioner` ambiguity without failing validation.
- [x] `V-NOTES-03` warns (not errors) on missing / malformed-YAML frontmatter, missing `id`, missing `recorded_at`.
- [x] AJV filtering preserves unrelated note schema errors while downgrading only `id` and `recorded_at` discoverability failures.
- [x] `V-NOTES-02` cardinality ≤ 1 warning per note pair / note-bearing communication for the same author-role concern.
- [x] `npm test` passes; `npm run typecheck` passes; `npm run check` reports `0 error(s), 0 warning(s) across 2 patient(s)`.

## Non-goals

- Schema edits, view edits, or fixture additions.
- New note subtypes; SBAR / action.notification / attestation expansion.
- A `nurse_practitioner` subtype/context allowlist.
- Narrative or timeline view changes.
- Notification / fulfillment surface changes.

## Verification

```bash
node --test --import tsx src/validate.test.ts
npm test
npm run typecheck
npm run check
```

## Future successor lanes (not authorized here)

- **NOTES-002** Provider/nursing notes view-layer translation (a6/a7 view surface).
- **NOTES-003** SBAR / action.notification / attestation expansion (gated on its own ADR).
- **NOTES-004** `nurse_practitioner` subtype/context allowlist (gated on a future HITL).

Each requires its own HITL disposition.
