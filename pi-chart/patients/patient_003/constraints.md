---
id: constraints_patient_003
type: constraint_set
subject: patient_003
effective_at: '2026-04-22T07:10:00-05:00'
recorded_at: '2026-04-22T07:10:00-05:00'
author:
  id: ed_triage_rn
  role: rn
source:
  kind: admission_intake
  ref: admission_2026-04-22
status: active
constraints:
  allergies:
    - substance: sulfamethoxazole-trimethoprim
      reaction: diffuse pruritic rash
      severity: moderate
      status: active
      source: patient_report
  code_status: full_code
  preferences:
    - daughter_to_receive_updates
  access_constraints:
    - avoid_tmp_smx
    - hold_metformin_during_lactic_acidosis_or_aki
    - renal_adjust_antibiotics_if_creatinine_worsens
---

# Constraints — patient_003

## Allergies
- TMP-SMX caused a diffuse pruritic rash in 2022. Avoid sulfonamide antibiotic re-challenge unless allergy is formally clarified.

## Active medication safety constraints
- Hold metformin during lactic acidosis, vomiting, and evolving sepsis.
- Hold losartan during hypotension and possible AKI risk.
- Renally adjust antimicrobials if creatinine rises from baseline.

## Code status and communication
- Full code confirmed with patient and daughter at 2026-04-22 07:25.
- Daughter is preferred update contact and will remain at bedside when possible.
