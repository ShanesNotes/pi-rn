---
id: note-002-014
type: communication
subtype: icu_progress_note
subject: patient_002
encounter_id: enc-002-001
effective_at: "2026-04-20T11:30:00-05:00"
recorded_at: "2026-04-20T12:30:00-05:00"
author:
  id: icu_resident
  role: md
source:
  kind: clinician_chart_action
  ref: daily_progress_note
status: final
links:
  supports:
    - evt-002-0091
    - evt-002-0093
    - evt-002-0095
    - evt-002-0099
    - evt-002-0103
---

# ICU progress note — hospital day 2

## Subjective
Patient sedated, intubated. Husband at bedside. No new events overnight per nursing.

## Objective
- Vitals (over last 24h): HR 80–94, MAP 76–84, SpO2 ≥ 96 on FiO2 0.4–0.5, T 37.2–37.6, on norepinephrine wean (0.05 → 0.03 mcg/kg/min).
- Sedation: RASS −2 on propofol 18 mcg/kg/min, fentanyl 50 mcg/hr.
- Vent: AC/VC TV 380, RR 22 set, PEEP 8, FiO2 0.4. Plateau 20, peak 24, compliance 38.
- I&O: net positive ~3,420 mL since admission; net negative ~600 mL on the night shift.

## Data
- Lactate normalized 1.6 [evt-002-0091]
- AM labs: WBC 14.8 (down from 18.2), Cr 1.7 (improving from 2.1, baseline 1.4) [evt-002-0093]
- Vancomycin trough 17.4 — in target [evt-002-0092]
- AM CXR: improving right lower lobe consolidation [evt-002-0095]
- Blood cultures: 1 of 2 sets, single bottle, GPC in clusters at 30h — likely contaminant [evt-002-0103]
- Urine culture: pending
- Respiratory viral panel: pending

## Assessment and plan
Day 2 of severe community-acquired pneumonia with septic shock, intubated for hypoxemic respiratory failure. Trajectory is favorable: lactate cleared, WBC trending down, hemodynamics stable on minimal pressor support, oxygenation improving on lower FiO2, AKI resolving.

1. **Septic shock from CAP** [evt-002-0003] — improving
   - Continue vancomycin and cefepime; ID consulted [evt-002-0105]
   - Wean norepinephrine off as tolerated
   - Trend lactate q12h while on pressors
2. **Acute hypoxemic respiratory failure, intubated** [evt-002-0004] — improving
   - Continue lung-protective ventilation
   - Plan SAT/SBT screening tomorrow morning if off pressors and FiO2 ≤ 0.4
3. **AKI on CKD 3a** [evt-002-0027] — resolving
   - Cr 1.7, near baseline of 1.4
   - Continue to hold metformin/losartan/furosemide
   - Will resume amlodipine when off pressors
4. **Sedation**
   - Lighten sedation goal to RASS −1 today; daily SAT in AM tomorrow
5. **Nutrition**
   - Initiate tube feeds at 20 mL/hr this afternoon, advance to goal per nutrition consult
6. **Prophylaxis**
   - SCDs continued; will re-evaluate chemical DVT prophylaxis tomorrow with stable platelets
   - Famotidine, HOB ≥ 30, oral care q4h

## Code status
Full code; husband HCP.
