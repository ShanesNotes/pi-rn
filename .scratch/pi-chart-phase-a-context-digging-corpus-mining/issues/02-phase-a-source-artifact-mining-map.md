# Phase A source artifact mining map

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Mine the Phase A source artifacts into a structured source-intent map that captures clinical function, minimum data, provenance, lifecycle, primitive/view grammar, open-schema questions, and v0.5 substrate implications. This slice extracts source intent only; it does not decide final v0.5 substrate by itself.

## Acceptance criteria

- [ ] Covers the Phase A control docs: charter, execution guide, template, and open-schema register.
- [ ] Covers A0a through A9b source artifacts, including split lanes such as A4b med reconciliation and A9a/A9b order work.
- [ ] Captures the Phase A method: clinical function → minimum data → provenance → lifecycle → pi-chart slot.
- [ ] Extracts primitive/link/view grammar and any proposed schema-slot pressure without promoting proposals to accepted design.
- [ ] Maps each source artifact to substrate families from the parent PRD, including vitals, labs, MAR, notes, nursing assessment, orders, handoff, review/accountability, and history/context.
- [ ] Uses the issue 01 template fields for source citation, brownfield coverage, corpus coverage, reconciliation state, and v0.5 implication.
- [ ] Flags source-artifact items that need later corpus/code reconciliation rather than resolving them silently.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/01-evidence-authority-ladder-and-mining-templates.md`
