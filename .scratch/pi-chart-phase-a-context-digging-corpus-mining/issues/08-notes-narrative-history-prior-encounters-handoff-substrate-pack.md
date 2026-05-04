# Notes, narrative, history, prior encounters, and handoff substrate pack

Status: ready-for-human
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Synthesize v0.5 substrate guidance for narrative chart digging: provider notes, nursing notes, communication, H&P, baseline history, prior encounters, discharge summaries, longitudinal background, care plan, handoff, and next-shift watch items. The output should clarify how narrative context stays useful without becoming duplicate canonical truth.

## Acceptance criteria

- [x] Covers provider notes, nursing notes, communication, H&P/baseline history, prior encounters, discharge summaries, longitudinal narrative, care plan, handoff, and watch items.
- [x] Distinguishes note truth, extracted/linked structured facts, derived summaries, and rendered note/handoff views.
- [x] Uses Phase A A0/A6/A7/handoff source evidence, brownfield narrative/memoryProof/contextBundle/derived behavior, and patient corpus examples.
- [x] Defines which narrative/history items are hot, warm, or cold for chart digging.
- [x] Explicitly identifies cold semantic/vector eligibility as future access requirements only, not implementation choice.
- [x] Preserves chart-once/project-many: one canonical fact should be reusable through note, review, open loop, care plan, and handoff projections without duplicate entry.
- [x] Does not edit notes, patients, UI, backend, vector, or source code.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/02-phase-a-source-artifact-mining-map.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/03-brownfield-implementation-crosswalk.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/04-patient-001-005-corpus-atlas.md`

## Closeout

Artifact created: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/notes-narrative-history-prior-encounters-handoff-substrate-pack.md`

Validation summary:

- Reused `.scratch/pi-chart-phase-a-context-digging-corpus-mining/mining-template.md` required row fields.
- Used approved source-map, brownfield-crosswalk, and corpus-atlas evidence; each artifact marks weak/missing evidence as mismatch-register input.
- Preserved canonical/derived/rendered and hot/warm/cold classifications.
- Boundary held: docs-only under `.scratch/pi-chart-phase-a-context-digging-corpus-mining`; no source, patient, ADR, design asset, lockfile, `pi-ledger`, or `pi-sim` edits.
- Corrective worker-4 closeout recreated the assigned substrate artifact at current HEAD and rechecked issues 11-14 remain `needs-triage`.
