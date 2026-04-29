# Patient 002 golden seed review packet

## Status and boundary

- Date: 2026-04-28.
- Lane: one-day `patient_002` golden seed review packet from `.omx/plans/ralplan-one-day-after-adr018-019.md`.
- Purpose: make the existing `patient_002` depth reviewable as the strongest current seed for CORP-019 and ADR018 spike baseline work.
- Boundary: this packet is **not ADR 019**, does not create `decisions/019-*`, does not pass CORP-019, and does not authorize clean-slate rewrite, storage-port migration, schema work, fixture edits, generated-artifact edits, importer work, validator work, or hidden simulator-state use.
- Current packet outcome: `patient_002` is a **signed-off golden seed / strongest seed**, but **not sufficient** for ADR 019 corpus readiness because the CORP-019 gate still requires `>=5` reviewed patients plus ADR018 spike input.

## Dirty-tree triage before this lane

This Ralph lane started from an already-dirty tree. The owned edit scope for this lane is limited to this packet and the parent corpus review cross-link.

| Path/status | Classification | Lane action |
|---|---|---|
| `patients/patient_002/artifacts/imaging/20220804_echo_report.md` modified | Existing `patient_002` golden-evidence artifact edit | Preserved; not edited by this packet lane. |
| `patients/patient_002/artifacts/imaging/20250805_echo_report.md` modified | Existing `patient_002` golden-evidence artifact edit | Preserved; not edited by this packet lane. |
| `patients/patient_002/artifacts/imaging/20260419_0445_cxr_report.md` modified | Existing `patient_002` golden-evidence artifact edit | Preserved; not edited by this packet lane. |
| `clinical-reference/broad-ehr-skeleton.md`, `clinical-reference/phase-a/PHASE-A-TEMPLATE.md`, `clinical-reference/phase-a/a9b-orderset-invocation-synthesis.md` modified | Existing corpus/ADR/domain-doc edits | Preserved; not edited by this packet lane. |
| `plans/deep-research-operating-system.md`, `plans/test-spec-deep-research-operating-system.md` modified | Existing planning-doc edits outside this lane | Preserved; not edited by this packet lane. |
| `../pi-sim/**` dirty in parent workspace | Unrelated simulator work | Out of scope; not touched. |
| `.omx/context/day-plan-after-adr018-019-20260428T145323Z.md`, `.omx/plans/ralplan-one-day-after-adr018-019.md` untracked | Planning context from the preceding ralplan lane | Preserved as planning evidence. |

Owned files for this lane:

1. `docs/plans/patient-002-golden-seed-review-packet.md`
2. `docs/plans/clinical-fidelity-corpus-review-adr-019.md` cross-link only

## ADR018 / CORP-019 / future ADR019 orientation

| Surface | Current meaning | Today boundary |
|---|---|---|
| ADR018 | Accepted architecture rebase: clinical truth/provenance substrate; hybrid path now; clean-slate only after bounded spike and later ADR. | Use as guardrail. Do not start rewrite. |
| CORP-019 | Corpus-readiness gate for future ADR019. | This packet contributes seed evidence only; CORP-019 remains fail / incomplete. |
| Future ADR019 | Pending decision after ADR018 spike input plus corpus readiness packet. | No `decisions/019-*` is created today. |
| `patient_002` | Golden seed / strongest current projection stress scenario. | Use for evidence review and later spike baseline; do not treat as product ontology or sufficient corpus. |

## Why `patient_002` is the golden seed

Repository inventory at lane start:

| Evidence class | Count / artifact | Why it matters |
|---|---:|---|
| Event rows | 96 | Enough event density to stress order/action/result, care-plan, communication, and provenance chains. |
| Vitals samples | 56 | Supports timed trajectory review and trend/evidence-window behavior. |
| Timeline notes | 10 | Gives narrative context for review, handoff, and follow-up projection. |
| Top-level artifact files | 10 including `artifacts/index.json` | Adds imaging, labs, immunization, and longitudinal clinical-reference context; 9 indexed payload artifacts if the index is excluded. |
| Derived memory proof | `patients/patient_002/_derived/memory-proof.md` | Existing generated projection answers what happened, why it mattered, evidence, uncertainty, open loops, and handoff. |
| Simulation/reference material | `patients/patient_002/simulation/**` | Useful evaluator/staging reference, explicitly not chart truth. Hidden physiology remains excluded from chart-visible output. |
| Test evidence | `src/views/memoryProof.test.ts` includes `patient_002 fixture covers all six broad EHR surfaces`, one-entry/many-projection reuse, hidden-state exclusion, and open-loop closure tests. | Provides executable guardrails that this seed exercises the intended memory-proof contract. |

## Six-surface operator review checklist

Use this table for operator review. Mark each row `pass`, `conditional pass`, or `fail`; record corrections before treating the row as readiness evidence.

| Surface | `patient_002` seed evidence to review | Suggested review outcome | Corrections / notes |
|---|---|---|---|
| Flowsheets / vitals | 56 vital samples, latest-vitals projection, oxygen/respiratory trajectory context. | Pending operator review. | Confirm whether trend density and oxygen context are clinically adequate for a golden seed. |
| Nursing assessment | Exam findings and focused work-of-breathing / respiratory assessment events. | Pending operator review. | Confirm bedside context is visible and not inferred from hidden simulator truth. |
| Notes / narrative charting | 10 timeline notes including ED/provider/nursing/handoff history. | Pending operator review. | Confirm narrative answers what happened, why it mattered, and what remains uncertain. |
| Orders / medications / interventions | Sepsis/order chain, medication orders/admins, oxygen action, ICU transfer/care-plan/open-loop items. | Pending operator review. | Confirm MAR/order semantics are enough for seed status while noting medication/MAR breadth remains limited. |
| Labs / diagnostics | ABG/lactate, core labs, imaging artifacts, result-review chain. | Pending operator review. | Confirm asynchronous results change or confirm interpretation and are linked with timing/provenance. |
| Care plan / handoff | Care-plan intents, handoff note/projection, open-intents projection. | Pending operator review. | Confirm handoff gives next clinician/agent watch items and pending work. |

## Memory-proof review prompts

The operator should be able to answer from `patients/patient_002/_derived/memory-proof.md` or equivalent projection output:

1. What changed?
2. Why did it matter?
3. What evidence/provenance supports the interpretation?
4. What remains uncertain?
5. What open loops remain?
6. What should the next clinician or agent watch next?

Current status: signed off by the same-thread operator on 2026-04-28 as golden-seed evidence only.

## One-entry / many-projection proof prompt

Candidate fact for review: a bedside respiratory/work-of-breathing observation tied to worsening oxygenation.

The operator should confirm whether one chart-visible fact is reused across:

1. review / current-state interpretation,
2. note or narrative projection,
3. open-loop or reassessment work,
4. handoff / next-shift context,
5. evidence-chain or memory-proof provenance.

Pass requires the fact to be charted once with source, author, timing, and evidence links. Duplicated prose alone does not satisfy the documentation-burden proof.

## Limits that block ADR 019 readiness

`patient_002` remains insufficient for ADR 019 corpus readiness because:

1. CORP-019 requires `>=5` reviewed patients; only `patient_001` and `patient_002` currently exist as seed rows.
2. `patient_002` is still one respiratory/sepsis-shock family and should not define product ontology alone.
3. Operator review/signoff is pending.
4. ADR018 spike input is not yet available.
5. Synthea seed/version/parameters are not recorded for this row.
6. Medication/MAR/reconciliation, I&O/device breadth, and non-respiratory scenario variety remain limited.

## Operator signoff

| Field | Value |
|---|---|
| Reviewer identity | Same-thread operator signoff |
| Reviewer role | Unspecified in signoff |
| Review date | 2026-04-28 |
| Patient/scenario reviewed | `patient_002` golden seed / strongest seed |
| Six-surface result | Signed off for golden-seed use |
| Memory-proof result | Signed off for golden-seed use |
| One-entry/many-projection result | Signed off for golden-seed use |
| Corpus-readiness implication | Seed evidence only; not sufficient for CORP-019 pass |
| Required corrections | Generate and review additional corpus patients before CORP-019 pass |

## Recommended next lane after review

If the operator accepts `patient_002` as a golden seed, choose one next lane:

1. **Corpus breadth lane:** create or plan `patient_003` with a different scenario family and multi-day six-surface coverage.
2. **ADR018 spike baseline lane:** capture current `patient_002` golden projections for later clean-slate comparison, still without starting rewrite.

Default recommendation: build `patient_003` next if the goal is ADR019 corpus readiness; run ADR018 spike baseline next if the goal is architecture comparison readiness.
