---
id: note-002-018
type: communication
subtype: icu_progress_note
subject: patient_002
encounter_id: enc-002-001
effective_at: "2026-04-21T14:00:00-05:00"
recorded_at: "2026-04-21T15:00:00-05:00"
author:
  id: icu_resident
  role: md
source:
  kind: clinician_chart_action
  ref: daily_progress_note
status: final
links:
  supports:
    - evt-002-0117
    - evt-002-0120
    - evt-002-0121
    - evt-002-0124
    - evt-002-0129
    - evt-002-0131
    - evt-002-0139
    - evt-002-0147
---

# ICU progress note — hospital day 3

## Subjective
Patient is awake, alert, conversational, in no distress. Reports mild sore throat and hoarseness post-extubation. Denies dyspnea or chest pain. Hungry; has been tolerating clear liquids. Husband at bedside.

## Objective
- Vitals (last 24h): HR 72–92, MAP 82–91, SpO2 ≥ 97 (on FiO2 0.30 then HFNC 30L 35% then HFNC 20L 30%), T 37.0–37.2, off pressors >24h.
- Post-extubation exam: voice slightly hoarse, no stridor, no accessory muscle use, RR 16–20, lungs with mild residual right basilar rhonchi but improved overall.
- Lines: RIJ central line in place; left radial art line discontinued at 14:00 [evt-002-0137]; OG and Foley remain in place at the time of this note with plan to remove OG after oral intake is tolerated.

## Data
- AM ABG (post-SBT, on PS5/PEEP5/FiO2 0.30): pH 7.40 / pCO2 40 / pO2 88 / HCO3 24 [evt-002-0120]
- AM labs: WBC 11.2, Cr 1.4 (baseline), BUN 18, K 4.2, Hgb 10.4 [evt-002-0121]
- Blood cultures: coag-neg staph, single bottle — confirmed contaminant [evt-002-0129]
- Respiratory viral panel: negative [evt-002-0147]

## Assessment and plan
Severe community-acquired pneumonia with septic shock and AKI, now on hospital day 3 — clinically resolving. Extubated this morning after passing SAT and SBT [evt-002-0124]; tolerating HFNC and now weaning. AKI resolved (Cr at baseline). Antibiotics narrowed.

1. **Resolving CAP** [evt-002-0003 → evt-002-0122]
   - Vancomycin and cefepime discontinued [evt-002-0131]
   - Ceftriaxone 1 g IV q24h started; complete 5-day course (through 2026-04-24)
2. **Post-extubation respiratory status** — improving
   - On HFNC 20L 30%; will wean to NC tomorrow if tolerated
   - Monitor for re-intubation criteria; bedside RT and BVM remain available
3. **Resolved AKI** — Cr at baseline 1.4
   - Resume amlodipine today [evt-002-0140]
   - Resume losartan tomorrow if BP and UOP remain stable
   - Continue to hold metformin and furosemide; reassess at discharge
4. **Nutrition**
   - Advance diet from clears → soft as tolerated
   - Stop tube feeds and remove OG once oral intake is tolerated
5. **Disposition**
   - Anticipate transfer to step-down or floor in AM if stable overnight [evt-002-0139]
   - Central line to be discontinued in AM with PIV access established
6. **Prophylaxis**
   - SCDs continued; will start subcutaneous heparin DVT prophylaxis tomorrow once at lower acuity
   - Continue famotidine

## Code status
Full code; husband HCP.
