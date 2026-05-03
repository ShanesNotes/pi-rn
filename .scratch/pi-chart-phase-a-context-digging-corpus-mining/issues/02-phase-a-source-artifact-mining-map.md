# Phase A source artifact mining map

Status: ready-for-human
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Mine the Phase A source artifacts into a structured source-intent map that captures clinical function, minimum data, provenance, lifecycle, primitive/view grammar, open-schema questions, and v0.5 substrate implications. This slice extracts source intent only; it does not decide final v0.5 substrate by itself.

## Acceptance criteria

- [x] Covers the Phase A control docs: charter, execution guide, template, and open-schema register.
- [x] Covers A0a through A9b source artifacts, including split lanes such as A4b med reconciliation and A9a/A9b order work.
- [x] Captures the Phase A method: clinical function → minimum data → provenance → lifecycle → pi-chart slot.
- [x] Extracts primitive/link/view grammar and any proposed schema-slot pressure without promoting proposals to accepted design.
- [x] Maps each source artifact to substrate families from the parent PRD, including vitals, labs, MAR, notes, nursing assessment, orders, handoff, review/accountability, and history/context.
- [x] Uses the issue 01 template fields for source citation, brownfield coverage, corpus coverage, reconciliation state, and v0.5 implication.
- [x] Flags source-artifact items that need later corpus/code reconciliation rather than resolving them silently.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/01-evidence-authority-ladder-and-mining-templates.md`
## Closeout evidence

- Source artifact mining map: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/source-artifact-mining-map.md`.
- Template reuse: the map uses the issue 01 required row fields, including source citation, brownfield code/test citation (`not-covered` for this source-only lane), corpus citation (`not-covered` for this source-only lane), reconciliation state, mismatch-register input, v0.5 implication, classification, hot/warm/cold class, and boundary check.
- Control docs covered: Phase A charter, execution guide, template, open-schema register, and status matrix.
- Source artifacts covered: A0a, A0b, A0c, A1, A2, A3, A4, A4b, A5, A6, A7, A8, A9a, A9a research/open-schema, and A9b.
- Later reconciliation preserved: source-only rows use `revise`, `defer`, or `open-question` where code/corpus/HITL/ADR evidence is still required; unresolved schema pressure is carried into mismatch-register input.
- Boundary verification: docs-only. No source code, patient fixtures/corpus, `_derived` outputs, schemas, tests, accepted ADRs, design assets, lockfiles, `pi-ledger`, or `pi-sim` internals were edited.
- Issues 05-14 status unchanged (`needs-triage`/not promoted).
- Git status at closeout: clean before validation closeout update; final closeout commit contains only this issue closeout evidence update.

### Verification

- PASS docs validation: required source citations, template row fields, issue checklist, changed-path scope, and issues 05-14 not promoted.
- PASS typecheck: `cd pi-chart && npm run typecheck`.
- PASS tests: `cd pi-chart && npm test` → 389 passed, 0 failed.
- PASS chart validation: `cd pi-chart && npm run validate` → 0 errors, 20 pre-existing warnings across 5 patients.
- PASS whitespace/static diff check: `git diff --check HEAD~1 HEAD -- .scratch/pi-chart-phase-a-context-digging-corpus-mining/`.
