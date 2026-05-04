# Hot/warm/cold context access model

Status: ready-for-agent
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Create the v0.5 context-access model for clinician-style chart digging. Classify which facts must be hot deterministic current context, which supporting evidence is warm chart-review context, and which longitudinal/background material is cold semantic retrieval candidate. This is an access-behavior model only; it must not pick vector, OpenBrain, backend, index, service, or storage technology.

## Acceptance criteria

- [ ] Defines hot, warm, and cold context in clinical terms with examples from substrate packs and patient corpus.
- [ ] Identifies hot facts that must never depend on semantic/vector retrieval, including safety constraints, active problems, current vitals/trajectory, active orders/intents, pending/open loops, current meds where relevant, and recent critical changes.
- [ ] Identifies warm context such as supporting evidence, recent notes, recent labs/orders/actions, review history, and nearby trend windows.
- [ ] Identifies cold context such as H&P, prior encounters, discharge summaries, consult history, old imaging narratives, longitudinal disease history, and narrative background.
- [ ] States that cold/semantic/vector eligibility is a future access requirement, not an implementation decision.
- [ ] Ties context-access classes back to evidence rows from issues 05-10.
- [ ] Does not introduce vector store, embeddings, OpenBrain architecture, backend selection, access-plane implementation, or runtime tools.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/05-hot-current-state-substrate-pack.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/06-trajectory-evidence-labs-diagnostics-substrate-pack.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/07-orders-mar-medrec-io-lda-open-loop-substrate-pack.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/08-notes-narrative-history-prior-encounters-handoff-substrate-pack.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/09-review-attestation-authorship-lifecycle-accountability-substrate-pack.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/10-rendered-chart-digging-and-prototype-design-evidence-pass.md`
## Comments

- 2026-05-04: Maintainer approved issues 05-10 substrate-pack outputs; this issue is unblocked for AFK synthesis.
