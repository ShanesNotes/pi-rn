# Patient 001 Operator Review Checklist — CORP-019 revised respiratory seed row

## Boundary

This checklist is for human/operator clinical realism review of revised `patient_001`. It is **not** ADR 019, does not claim ADR019 readiness, does not create a replacement patient, and must not count hidden simulator/private state as evidence.

## Review identity

| Field | Value |
|---|---|
| Reviewer identity | Pending operator review |
| Reviewer role | Pending operator review |
| Review date | Pending operator review |
| Patient/scenario reviewed | `patient_001` — respiratory deterioration seed deepened in place |
| Current row status | Revised-for-review candidate / machine-validation passed in Ralph run / operator-review-pending |
| Proof fact under review | `evt_20260418T0842_02` — focused respiratory reassessment after oxygen titration |
| Signoff | Pending: pass / conditional pass / fail |

## Scenario realism questions

1. Does the oxygen titration, focused respiratory reassessment, and follow-up lab timing fit a medicine-ward pneumonia watch?
2. Does the proof fact avoid overclaiming improvement while making the unresolved respiratory risk actionable?
3. Are the nursing actions, lab review, care plan, and handoff visible in chart evidence rather than implied?
4. Are the escalation criteria clinically plausible for the patient’s current severity?
5. Does the row remain honest about its limits: single-day respiratory seed, no Synthea metadata, and no accepted operator signoff yet?

## Six-surface review

| Surface | Reviewer finding | Corrections required |
|---|---|---|
| Flowsheets / vitals | Pending | Pending |
| Nursing assessment | Pending | Pending |
| Notes / narrative charting | Pending | Pending |
| Orders / medications / interventions | Pending | Pending |
| Labs / diagnostics | Pending | Pending |
| Care plan / handoff | Pending | Pending |

## Memory-proof review

| Check | Reviewer finding | Corrections required |
|---|---|---|
| What happened is clinically coherent | Pending | Pending |
| Why it mattered explains respiratory-watch risk | Pending | Pending |
| Evidence/provenance remains chart-visible | Pending | Pending |
| Uncertainty is honest and not overclaimed | Pending | Pending |
| Open loops are actionable for next shift | Pending | Pending |
| Next-shift handoff carries the proof fact | Pending | Pending |

## Decision

- [ ] Pass — acceptable as reviewed corpus evidence.
- [ ] Conditional pass — acceptable after listed corrections.
- [ ] Fail — do not count toward reviewed corpus evidence.

## Required corrections / notes

Pending operator review.

## Proceed / stop decision

Pending operator review. Until completed, `patient_001` may count only as a revised-for-review candidate, not reviewed ADR019 readiness evidence.
