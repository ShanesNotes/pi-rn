# Patient 001 Operator Review Checklist — CORP-019 deepened respiratory watch with pi-agent harness scaffolding

## Boundary

This checklist is for human/operator clinical realism review of revised `patient_001`. It is **not** ADR 019, does not claim ADR019 readiness, does not create a replacement patient, and must not count hidden simulator/private state as evidence.

## Review identity

| Field | Value |
|---|---|
| Reviewer identity | Pending operator review |
| Reviewer role | Pending operator review |
| Review date | Pending operator review |
| Patient/scenario reviewed | `patient_001` — respiratory deterioration seed deepened in place with pi-agent harness scaffolding |
| Current row status | Revised-for-review candidate / machine-validation passed / operator-review-pending |
| Proof fact under review | `evt_20260418T0842_02` — focused respiratory reassessment after oxygen titration |
| Encounter span | 2026-04-18 07:00 → 2026-04-19 15:00 (32-hour CAP arc, single encounter `enc_001`) |
| Signoff | Pending: pass / conditional pass / fail |

## Deepening summary (for operator quick-scan)

**Proof fact** — `evt_20260418T0842_02`: focused respiratory reassessment after oxygen titration — SpO2 91-92% on 3 L NC, RR 23, productive cough of yellow sputum, no accessory muscle use at rest, persistent dyspnea with repositioning. Reused across review/evidence/open-loop/handoff/narrative on day 1 and into day 2 morning handoff.

**Vitals trajectory.**

| Time | SpO2 / O2 device | RR | HR | Temp | Note |
|---|---|---|---|---|---|
| 2026-04-18 08:00 | 94% / RA | 18 | 88 | — | baseline |
| 2026-04-18 08:40 | 89% / 2L NC | 24 | 108 | 38.1 | worsening trend triggers MD orders |
| 2026-04-18 09:00 | 92% / 3L NC | 22 | 102 | 37.9 | partial response; closes evt_20260418T0830_02 |
| 2026-04-18 09:30 | 93% / 3L NC | 21 | 98 | — | focused reassessment closes evt_20260418T0844_01 |
| 2026-04-18 13:00 | 94% / 3L NC | 19 | 92 | 37.6 | afternoon recovery on antibiotics |
| 2026-04-18 19:00 | 95% / 2L NC | 18 | 84 | — | titrated down |
| 2026-04-19 06:30 | 95% / 2L NC | 17 | 80 | 37.0 | overnight stable; weight 78.4 kg |
| 2026-04-19 12:00 | 96% / 1L NC | 16 | 78 | — | continued recovery |
| 2026-04-19 15:00 | 97% / RA | 16 | 76 | — | room air sustained |

**Lab trajectory.** Admit BMP/CBC at 09:20 (WBC 15.2, neutrophil 82%, Cr 1.0, lactate 1.8, procalcitonin 1.2) → AM repeat at 07:30 day-2 (WBC 11.8, neutrophil 74%, Cr 1.0 stable). Blood culture preliminary "no growth at 4 hours" remains open.

**Imaging.** Admit portable AP CXR at 07:00 (LLL consolidation) → repeat AM CXR at 08:00 day-2 (slightly improved).

**Antibiotic arc.** Allergy-aware orderset at 09:25 (levofloxacin + azithromycin + class hold on all beta-lactams given penicillin anaphylaxis 1998) → first IV doses at 11:30 / 11:35 → pharmacy med-rec verification at 11:40 → day-2 plan at 09:00 transitions to oral levofloxacin.

**Loop closures.** Two open intents from morning explicitly closed: SpO2-maintenance care plan (`evt_20260418T0830_02`) resolved at 09:02; respiratory-watch care plan (`evt_20260418T0844_01`) resolved at 09:32.

**Contested-claim resolution.** RT independent exam at 10:00 (`evt_20260418T1000_01`) noted mild deep-inspiration accessory use; `links.contradicts evt_20260418T0842_02`. Covering MD trend at 10:15 (`evt_20260418T1015_01`) resolves contradiction with at-rest-vs-deep-inspiration rationale; `links.resolves evt_20260418T1000_01`.

**Notes by day.**

- 2026-04-18 (8): goals_of_care (08:20), nursing follow-up (08:44), 08:45 SBAR, focused reassessment (09:30), RT consult (10:00), pharmacy med-rec (11:40), family update (16:30), day→night SBAR (17:00).
- 2026-04-19 (2): morning handoff (06:30), hospitalist progress note (08:30).
- Total: 10 narratives.

**Author/role diversity.** day_rn (rn), admitting_rn (rn), night_rn (rn), pi-agent (rn_agent), covering_md (md), hospitalist (md), night_resident (md), respiratory_therapist (rt), clinical_pharmacist (pharmd), radiologist_day (md), xray_tech (tech), point_of_care_lab (system), core_lab (system) = 13 distinct authors.

**Pi-agent harness scaffolding.**

- `simulation/latent_release/release_schedule.ndjson` (5 timed releases through 06:30 day-2)
- `simulation/latent_release/latent_events.ndjson` (release-to-event mapping)
- `simulation/live_expected/agent_task_queue.ndjson` (7 expected agent tasks at 08:50, 09:30, 10:15, 11:35, 17:00, 19:30, 06:30 day-2)
- `simulation/live_expected/agent_response_rubric.json` (~18 scoring axes including proof-fact citation, no-copy-paste, source attribution, threshold evaluation, no-hidden-state-leak, no-future-leak)
- `simulation/hidden_truth/pi_sim_reference.jsonl` (boundary test fixture; physiology truth not visible in chart)

## Scenario realism questions

1. Does the oxygen titration, focused respiratory reassessment, and follow-up lab timing fit a medicine-ward pneumonia watch?
2. Does the proof fact avoid overclaiming improvement while making the unresolved respiratory risk actionable?
3. Are the loop closures (`evt_20260418T0830_02` and `evt_20260418T0844_01`) clinically plausible at the times shown?
4. Is the RT independent exam at 10:00 a realistic source of contested-claim friction? Is the MD reconciliation rationale appropriate?
5. Are the antibiotic choices (levofloxacin + azithromycin + class hold on all beta-lactams) defensible given the penicillin anaphylaxis allergy?
6. Are the q4h monitoring plan thresholds clinically appropriate for this patient's severity at 09:35?
7. Does the family update tone fit the patient's stated return-to-work priority without overclaiming the discharge timeline?
8. Does the day-2 hospitalist plan transition criteria (PO levofloxacin / discharge tomorrow) fit the lab and CXR trajectory?
9. Are the pi-agent harness tasks (agent_task_queue.ndjson) realistic agent prompts that exercise the chart correctly?
10. Does the hidden-state boundary hold — is anything in `simulation/hidden_truth/` referenced anywhere in `timeline/`, `artifacts/`, `_derived/`, or `scenario-blueprints/`?

## Six-surface review

| Surface | Reviewer finding | Corrections required |
|---|---|---|
| Flowsheets / vitals | Pending | Pending |
| Nursing assessment | Pending | Pending |
| Notes / narrative charting | Pending | Pending |
| Orders / medications / interventions (MAR + class hold) | Pending | Pending |
| Labs / diagnostics (admit + AM repeat + CXR x 2) | Pending | Pending |
| Care plan / handoff (incl. loop closures + contested-claim resolution + multi-day continuation) | Pending | Pending |

## Memory-proof review

| Check | Reviewer finding | Corrections required |
|---|---|---|
| What happened is clinically coherent | Pending | Pending |
| Why it mattered explains respiratory-watch risk | Pending | Pending |
| Evidence/provenance remains chart-visible | Pending | Pending |
| Uncertainty is honest and not overclaimed | Pending | Pending |
| Open loops are actionable for next shift | Pending | Pending |
| Next-shift handoff carries the proof fact | Pending | Pending |
| Multi-day continuation preserves proof-fact reuse | Pending | Pending |

## Pi-agent harness review

| Check | Reviewer finding | Corrections required |
|---|---|---|
| latent_release/release_schedule.ndjson timing is plausible | Pending | Pending |
| live_expected/agent_task_queue.ndjson tasks are realistic and well-scoped | Pending | Pending |
| live_expected/agent_response_rubric.json scoring axes are clear and binary | Pending | Pending |
| hidden_truth/pi_sim_reference.jsonl is genuinely unreferenced from the visible chart (boundary holds) | Pending | Pending |

## Decision

- [ ] Pass — acceptable as reviewed corpus evidence and approved as a pi-agent harness fixture.
- [ ] Conditional pass — acceptable after listed corrections.
- [ ] Fail — do not count toward reviewed corpus evidence.

## Required corrections / notes

Pending operator review.

## Proceed / stop decision

Pending operator review. Until completed, `patient_001` may count only as a revised-for-review candidate, not reviewed ADR019 readiness evidence.
