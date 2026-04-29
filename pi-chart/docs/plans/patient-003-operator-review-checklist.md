# Patient 003 Operator Review Checklist

## Status and boundary

- Patient: `patient_003`
- Scenario: obstructing pyelonephritis / infection escalation with sepsis physiology and ED-to-MICU transition.
- Current state: revised-for-review candidate after in-place deepening; machine validation passed in the Ralph run; external operator clinical review pending.
- Boundary: CORP-019 corpus review only. This is **not ADR019**, does not authorize rewrite, and must not count hidden simulator/private state as evidence.

## What to review

Primary chart locations:
- `patients/patient_003/patient.md`
- `patients/patient_003/constraints.md`
- `patients/patient_003/timeline/2026-04-22/events.ndjson`
- `patients/patient_003/timeline/2026-04-22/vitals.jsonl`
- `patients/patient_003/timeline/2026-04-22/notes/*.md`
- `patients/patient_003/artifacts/index.json`
- `patients/patient_003/_derived/memory-proof.md` after rebuild, including the 22:00 lactate and overnight source-control bridge
- `docs/plans/clinical-fidelity-corpus-review-adr-019.md` row for `patient_003`

Machine proof fact:
- `evt-003-0018` — MAP 58 with lactate 4.6 and delayed capillary refill after initial fluid resuscitation; reused through ED/MICU handoff and overnight source-control bridge.

## Review matrix

| Check | Pass / Partial / Gap | Notes / required corrections |
|---|---|---|
| Clinical scenario is plausible and distinct from patient_002 |  |  |
| Vitals/flowsheet trend supports escalation and reassessment |  |  |
| Bedside nursing assessment contains chart-visible findings not inferable from monitors alone |  |  |
| Narrative notes explain the clinical evolution and reference chart evidence |  |  |
| Orders/medications/interventions have clear intent/action/result-review chain |  |  |
| Labs/diagnostics are timed, sourced, and decision-changing |  |  |
| Care plan/handoff tells next shift pending work and contingencies |  |  |
| Memory proof answers what happened / why / evidence / uncertainty / open loops / handoff |  |  |
| `evt-003-0018` is reused across review, evidence, open loop, handoff, and narrative |  |  |
| Hidden simulator/evaluator/private state does not appear in visible chart surfaces |  |  |
| Corpus packet row is accurate and does not overclaim ADR019 readiness |  |  |

## Signoff

| Field | Value |
|---|---|
| Reviewer identity |  |
| Reviewer role |  |
| Review date |  |
| Overall result | Pass / conditional pass / fail |
| Required corrections before accepted evidence use |  |
| Can this revised row count as reviewed corpus evidence? | Pending operator decision: yes / no / yes after corrections |

## Decision rule

- **Pass**: mark `patient_003` as reviewed corpus evidence in a later operator-approved packet update; do not claim ADR019 readiness from this row alone.
- **Conditional pass**: apply listed patient_003 corrections first if they affect package/test pattern; otherwise carry follow-up explicitly.
- **Fail**: keep `patient_003` out of reviewed evidence and open a targeted repair lane using the operator objections.
