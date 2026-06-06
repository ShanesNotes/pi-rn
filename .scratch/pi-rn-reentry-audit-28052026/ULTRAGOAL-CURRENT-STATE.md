# Ultragoal current-state audit

Date: 2026-05-31
Branch: `reentry-substrate-field-spec`

## Handoff anchor

This audit uses `.scratch/pi-rn-reentry-audit-28052026/HANDOFF.md` as the pick-up point.

Confirmed commits:

- `89bd625 Add re-entry audit, substrate-field PRD+issues, truth-service proposal`
- `196c819 Resolve substrate drift: ContextPacket rename + stale-doc fixes`

The branch is in sync with `origin/reentry-substrate-field-spec`.

## Current interpretation

The project is not yet rebased from `pi-chart` onto `pi-ledger`. The reusable `pi-ledger` kernel is treated as done and adapter-ready; `pi-chart` remains brownfield and needs the per-patient charted-clinical-fact field contract settled before seam work.

At the time this audit was written, the latest committed work was only a handoff/spec work surface and was gated on `grill-with-docs --auto`. That gate is now superseded: the user explicitly pivoted to a human `grill-with-docs` session, decisions D001-D012 are recorded in `GRILL-WITH-DOCS-HUMAN-DECISIONS.md`, and G002/G003 are checkpointed complete in the ultragoal ledger.

The current implementation authority is therefore:

- accepted field/spec decisions D001-D005 in the human-grill decision log and patched issue docs;
- accepted clinical-truth-service decisions D006-D012, promoted into `pi-ledger` ADR 009 and `pi-chart` ADR 021;
- remaining seam implementation gates for registry ownership, canonicalization/hash acquisition, versioned service contract, and conformance vectors.

## Worktree state

Tracked files now changed by this ultragoal setup:

- `.scratch/pi-rn-reentry-audit-28052026/ULTRAGOAL-BRIEF.md`
- `.scratch/pi-rn-reentry-audit-28052026/ULTRAGOAL-CURRENT-STATE.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/RECONCILIATION.md`

Pre-existing untracked design/presentation assets remain deliberately untouched:

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/lean-v0-5-shift-brain-review-deck.html`
- `pi-chart/docs/design/Pi-chart Design System.zip`
- `pi-chart/docs/design/pi-chart-logo.png`
- `showcase/`

## Reconciliation refresh

`issues/RECONCILIATION.md` was initially stale in two places:

- It still called the `context.segment` shape/naming seam a hidden hard contradiction even though Issue 02 now explicitly owns it as OQ-4.
- It still said Issue 11 used clinician display labels as `source.kind` values, but Issue 11 now uses Issue 06 machine enum values.

The refreshed reconciliation now treats those as:

- `context_segment`: originally moved from hidden contradiction to open decision; now resolved by human-grill D001 as `factShape=observation` with `predicateId=observation.context_segment`.
- Issue 11 source-kind derivation: clean.

The minor cleanup items listed by the initial audit were completed during G005/G006 reconciliation: Issue 12 uses `evidence: EvidenceRef[]`, Issue 07 cites PRD §2.E for `transform`, Issue 13 points `VitalSample.quality` to Issue 04, and Issue 04 cross-references Issue 01.

## Next ultragoal story

The old next story was to retry `grill-with-docs --auto`; that is now historical. The current final story is G006 final verification/review after the human-grill decision replacement.
