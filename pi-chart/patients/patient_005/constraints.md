---
id: constraints_patient_005
type: constraint_set
subject: patient_005
effective_at: '2026-04-23T19:55:00-05:00'
recorded_at: '2026-04-23T19:55:00-05:00'
author:
  id: pacu_rn
  role: rn
source:
  kind: admission_intake
  ref: postop_transfer_2026-04-23
status: active
constraints:
  allergies:
    - substance: diphenhydramine
      reaction: severe confusion
      severity: moderate
      status: active
      source: daughter_report
    - substance: codeine
      reaction: nausea
      severity: mild
      status: active
      source: patient_report
  code_status: full_code
  preferences:
    - daughter_to_receive_updates
    - keep_hearing_aids_and_glasses_available_for_orientation
  access_constraints:
    - high_fall_risk_requires_assisted_transfers
    - avoid_diphenhydramine_and_benzodiazepines_due_to_delirium_risk
    - weight_bearing_as_tolerated_right_leg_with_walker_and_staff_assist
    - balance_opioid_analgesia_against_sedation_and_delirium_risk
---

# Constraints — patient_005

## Allergies and medication safety
- Diphenhydramine causes severe confusion and should be avoided.
- Codeine causes nausea.
- Avoid benzodiazepines and anticholinergics unless a clinician documents an overriding need.

## Functional/safety constraints
- High fall risk after right hip fracture repair.
- Weight bearing as tolerated on right leg with walker and staff assist.
- Bed/chair alarms, low bed, call light in reach, toileting schedule, glasses/hearing aids, sleep hygiene, and family reorientation are active delirium/fall precautions.

## Code status and communication
- Full code confirmed with daughter on 2026-04-23 at 20:05.
- Daughter should receive overnight safety updates and therapy-plan changes.
