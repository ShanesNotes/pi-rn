---
id: constraints_patient_002
type: constraint_set
subject: patient_002
effective_at: '2026-04-19T04:10:00-05:00'
recorded_at: '2026-04-19T04:10:00-05:00'
author:
  id: ed_triage_rn
  role: rn
source:
  kind: admission_intake
  ref: admission_2026-04-19
status: active
constraints:
  allergies: []
  code_status: full_code
  preferences:
    - aggressive_resuscitation_and_icu_level_care
  access_constraints:
    - renal_adjusted_dosing_required
    - metformin_held_during_aki
    - losartan_held_during_hypotension
  advance_directive: ''
---

# Constraints — patient_002

This snapshot reflects the structural state at admission. Canonical
event-stream `assessment.constraint` entries with provenance and review
actions are recorded in the daily `events.ndjson` files.

## Allergies
- No known drug allergies (NKDA)

## Active hold / contraindication considerations
- **Metformin** held on admission due to AKI; do not resume until renal
  function and contrast/sepsis status are stable.
- **Losartan** held on admission due to AKI and hypotension.
- **Furosemide** held on admission due to volume-depleted septic shock;
  reassess once euvolemic.
- **Amlodipine** held on admission due to hypotension; reassess.
- **Aspirin 81 mg** continued unless bleeding concern develops.

## Renal dosing
- Baseline Cr 1.4 (CKD 3a), admission Cr 2.1 (AKI on CKD).
- All antimicrobials, anticoagulants, and renally cleared agents must be
  reviewed by pharmacy at order entry and at minimum once per 24h while
  Cr is changing.

## Code status
- Full code on admission (patient and husband, 2026-04-19 04:25).

## Goals of care
- Aggressive resuscitation and ICU-level care consented to; revisit if
  trajectory changes.

## Isolation
- Droplet precautions until respiratory viral panel and influenza/COVID
  rule-out complete.
