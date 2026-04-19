---
id: constraints_patient_001
type: constraint_set
subject: patient_001
effective_at: "2026-04-18T06:15:00-05:00"
recorded_at: "2026-04-18T06:15:00-05:00"
author:
  id: admitting_rn
  role: rn
source:
  kind: admission_intake
  ref: admission_2026-04-18
status: active
constraints:
  allergies:
    - substance: penicillin
      reaction: anaphylaxis (1998)
      severity: anaphylaxis
      source: patient_report
      status: active
  code_status: full_code
  preferences:
    - minimize_sedation_if_possible
    - return_to_work_priority
  access_constraints: []
  advance_directive: ""
---

# Constraints

## Allergies and intolerances
- **Penicillin** — anaphylaxis, per patient report (reaction 1998).
  - Verified with patient on admission.
  - Avoid all penicillins. Caution with broad-spectrum beta-lactams; discuss with
    pharmacy before administration.

## Code status
- **Full code** — confirmed with patient on admission.

## Goals of care
- Wants aggressive treatment toward discharge home.
- Three minor children at home; patient is primary earner — emphasizes return
  to work as a priority.
- Prefers minimal sedation if possible; wants to remain conversant.

## Access / dosing constraints
- None currently known.
- Renal function at admission within normal range (see labs).

## Advance directives
- No documented advance directive on file.
- Healthcare proxy: spouse (contact info in intake).
