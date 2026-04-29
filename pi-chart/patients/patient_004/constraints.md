---
id: constraints_patient_004
type: constraint_set
subject: patient_004
effective_at: '2026-04-23T07:05:00-05:00'
recorded_at: '2026-04-23T07:05:00-05:00'
author:
  id: ed_triage_rn
  role: rn
source:
  kind: admission_intake
  ref: admission_2026-04-23
status: active
constraints:
  allergies:
    - substance: lisinopril
      reaction: cough
      severity: mild
      status: active
      source: patient_report
  code_status: full_code
  preferences:
    - spouse_to_receive_updates
  access_constraints:
    - avoid_nsaids_due_to_ckd_and_heart_failure
    - hold_raas_agents_during_aki_or_hyperkalemia
    - hold_metformin_during_aki
    - verify_renal_dosing_for_anticoagulation_if_creatinine_worsens
---

# Constraints — patient_004

## Allergies
- Lisinopril caused cough. No anaphylaxis history.

## Active medication safety constraints
- Avoid NSAIDs because of CKD, AKI risk, and HFpEF volume overload.
- Hold losartan and spironolactone while potassium remains elevated or creatinine is above baseline.
- Hold metformin while AKI is active.
- Continue anticoagulation only with explicit renal-dose review if kidney function worsens.

## Code status and communication
- Full code confirmed with patient and spouse at 2026-04-23 07:25.
- Spouse manages the pill organizer and should be included in medication teaching.
