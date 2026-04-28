---
id: note-002-010
type: communication
subtype: rt_note
subject: patient_002
encounter_id: enc-002-001
effective_at: "2026-04-19T19:30:00-05:00"
recorded_at: "2026-04-19T19:32:00-05:00"
author:
  id: icu_rt
  role: rt
source:
  kind: rt_charted
  ref: shift_note
status: final
links:
  supports:
    - evt-002-0035
    - evt-002-0053
    - evt-002-0061
    - evt-002-0070
---

# Respiratory therapy note — day shift

## Airway
ETT 7.5 mm secured at 22 cm at lip. Cuff pressure 25 cmH2O, checked q4h. No leak. Secretions thick, yellow, moderate volume.

## Ventilation
- Initial post-intubation: AC/VC, TV 380 (6 mL/kg PBW 63 kg), RR 22 set, PEEP 8, FiO2 1.0 [evt-002-0061].
- Plateau pressure 22 cmH2O, peak 26 cmH2O, dynamic compliance 36 mL/cmH2O.
- Patient triggering 0–2 breaths above set rate.
- FiO2 weaned through the shift: 1.0 → 0.6 → 0.5 [evt-002-0070] with stable SpO2 ≥ 96.

## ABG sequence
- 04:55 (4 L NC): 7.31 / 32 / 64 [evt-002-0030]
- 08:45 (HFNC 60L 80%): 7.26 / 38 / 62 [evt-002-0057] — escalation to intubation
- 10:00 (AC/VC FiO2 1.0): 7.32 / 36 / 102 [evt-002-0067] — improvement, FiO2 wean started

## Suctioning
Q4h and PRN. Yielding moderate amounts of thick yellow secretions consistent with the right lower lobe pneumonia.

## Plan
Continue current settings overnight. Plan SAT/SBT screening in AM if hemodynamically stable off pressors. Goal extubation parameters: PEEP ≤ 5, FiO2 ≤ 0.4, RSBI < 105.
