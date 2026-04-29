# Patient 004 Operator Review Checklist

## Status

- Patient/scenario: `patient_004` — HFpEF/CKD medication-management 3-day admission with AKI/hyperkalemia risk.
- Machine state: generated / Ralph machine-verified; accepted anchor for this review cycle; clinical content frozen in the current lane.
- Operator review: accepted anchor per current operator instruction; do not churn clinical content in this lane.
- Source mix: fully hand-authored synthetic row; no Synthea seed, version, or parameters used.
- Encounter span: 2026-04-23 07:05 → 2026-04-25 13:00 (3 hospital days, ED → telemetry → discharge home).

## Multi-day evidence summary (for operator quick-scan)

**Proof fact** — `evt-004-0017`: K 5.6 with creatinine 2.2 from baseline 1.4 after home losartan, spironolactone, and recent ibuprofen exposure; hold losartan/spironolactone/metformin/NSAIDs and repeat BMP after diuresis.

**BMP trajectory.**

| Time | K | Cr | Source event | Day-arc role |
|---|---|---|---|---|
| 2026-04-23 08:12 | 5.6 | 2.2 | `evt-004-0013` | Admission proof fact |
| 2026-04-23 12:10 | 5.2 | 2.1 | `evt-004-0023` | First post-diuresis check |
| 2026-04-23 18:05 | 4.9 | 2.0 | `evt-004-0030` | Day-1 evening |
| 2026-04-24 04:30 | 4.6 | 1.8 | `evt-004-0035` | Day-2 morning |
| 2026-04-24 14:45 | 4.4 | 1.6 | `evt-004-0052` | Day-2 afternoon |
| 2026-04-25 06:00 | 4.2 | 1.5 | `evt-004-0063` | Predischarge (baseline 1.4) |

**Weight trajectory.** 90.4 kg (admission) → 88.6 kg (day 2 AM) → 87.2 kg (discharge) = -3.2 kg cumulative.

**Diuretic transition.** IV furosemide 40 mg q12h (days 1–2) → torsemide 20 mg PO daily (discharge); first inhouse PO dose given 2026-04-25 11:00 to confirm tolerance.

**Outpatient restart criteria documented in chart.**

- Losartan, spironolactone — outpatient cardiology in 1 week with K below 5.0 and Cr 1.5 or lower (`evt-004-0074`, `note_20260425T0830_cardiology_discharge`).
- Metformin — outpatient nephrology in 2 weeks with confirmatory BMP Cr 1.5 or lower (`evt-004-0074`, `note_20260425T0900_nephrology_discharge`).
- NSAIDs — avoid indefinitely; acetaminophen for knee pain (`note_20260425T0930_pharmacy_discharge_med_rec`).

**Notes by day.**

- Day 1 (2026-04-23): ED triage, ED provider, pharmacy med-rec, ED→telemetry SBAR, telemetry night handoff (5).
- Day 2 (2026-04-24): morning handoff, hospitalist progress, cardiology consult, nephrology consult, pharmacy med review, PT eval, patient education, night handoff (8).
- Day 3 (2026-04-25): morning handoff, hospitalist discharge rounds, cardiology discharge note, nephrology discharge note, pharmacy discharge med-rec, discharge education, discharge SBAR (7).
- Total: 20 narratives.

## Signoff fields

| Field | Value |
|---|---|
| Reviewer identity | Operator instruction in current Ralph request |
| Reviewer role | Operator / corpus reviewer |
| Review date | 2026-04-29 |
| Scope reviewed | `patients/patient_004/**`, memory proof, corpus packet row, semantic guardrails, multi-day BMP/weight/diuretic/restart-criteria continuity |
| Decision | Accepted anchor for current CORP-019 review cycle; frozen |
| Required corrections | None in this lane; do not edit `patient_004` clinical content |
| Proceed to patient_005? | Already generated; `patient_005` is revised-for-review pending operator signoff |

## Review questions

1. Does the HFpEF/CKD medication-management 3-day arc feel clinically plausible and distinct from patient_002/patient_003?
2. Is the BMP recovery trajectory (K 5.6 → 4.2; Cr 2.2 → 1.5 over 3 days) clinically realistic given the diuresis schedule and held medications?
3. Are med holds, med administrations, the IV-to-PO torsemide transition, and outpatient restart criteria visible from chart evidence rather than implied?
4. Does `evt-004-0017` propagate through every relevant surface across all 3 days (assessment, lab review, consult notes, pharmacy reviews, education, discharge SBAR)?
5. Are BMP/weight/I&O timing and provenance sufficient to reconstruct each day's plan revision?
6. Do day-level handoffs (morning + night each day, plus discharge SBAR) tell the next shift or outpatient team what to do, what is pending, and what would change the plan?
7. Are uncertainty and restart criteria visible at every relevant surface, especially around RAAS/MRA/metformin restart and renal-dose anticoagulation checks?
8. Is there any hidden simulator/evaluator/private state in visible chart surfaces?
9. Does the corpus packet avoid claiming ADR019 readiness from this row alone, while accurately marking patient_004 as the corpus's first multi-day row?

## Row-level surface review

| Surface | Pass/partial/gap | Notes |
|---|---|---|
| Vitals/flowsheet trend | Pending | 6 timepoints day-1 + 6 day-2 + 4 day-3; weight and I&O event-embedded |
| Bedside nursing assessment | Pending | Triage exam, evening reassessment, day-2 morning handoff exam, day-3 ambulation/discharge readiness |
| Notes/narrative | Pending | 20 notes spanning 3 days; proof-fact threaded through each handoff and consult |
| Orders/meds/interventions | Pending | Admission orderset, IV furosemide titration, MAR holds × 3 days, IV-to-PO torsemide transition, discharge prescription set |
| Labs/diagnostics | Pending | 5 BMPs with K/Cr trend, BNP, troponin, magnesium, admission CXR |
| Care plan/handoff | Pending | 4 care-plan events (`evt-004-0025`, `0032`, `0055`, `0059`, `0078`), 6 handoff/SBAR notes (5 inpatient + 1 to outpatient PCP) |

## Decision rule

- Accepted anchor: keep patient_004 as reviewed corpus evidence for this cycle, but do not claim ADR019 readiness until the remaining revised candidates are reviewed and ADR018 input is handled.
- Conditional pass: patch patient_004 first if corrections affect package/test pattern.
- Fail: stop corpus generation and re-plan before patient_005.
