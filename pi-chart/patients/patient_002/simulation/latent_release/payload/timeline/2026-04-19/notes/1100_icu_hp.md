---
id: note-002-007
type: communication
subtype: icu_hp
subject: patient_002
encounter_id: enc-002-001
effective_at: "2026-04-19T11:00:00-05:00"
recorded_at: "2026-04-19T11:30:00-05:00"
author:
  id: icu_resident
  role: md
source:
  kind: clinician_chart_action
  ref: icu_admission_note
status: final
links:
  supports:
    - evt-002-0003
    - evt-002-0004
    - evt-002-0027
    - evt-002-0024
    - evt-002-0025
    - evt-002-0030
    - evt-002-0057
    - evt-002-0060
    - evt-002-0067
    - evt-002-0073
    - evt-002-0069
---

# ICU history and physical — 11:00

## Chief complaint
Septic shock with respiratory failure; intubated 09:30.

## HPI
68F with PMH of T2DM, HTN, HFpEF (EF 58%), CKD 3a (baseline Cr 1.4) presenting from home with three days of cough, fever to 39 C, and progressive dyspnea. Arrived in the ED at 04:10 hypotensive (94/58), tachycardic (118), febrile (38.9), hypoxic to 88% on room air [evt-002-0001]. Initial workup notable for WBC 18.2 with bandemia, lactate 3.8, AKI with Cr 2.1 (from 1.4), procalcitonin 4.2, and ABG with metabolic acidosis (pH 7.31 / HCO3 16) [evt-002-0023, evt-002-0024, evt-002-0025, evt-002-0026, evt-002-0030]. Portable CXR demonstrated dense right lower lobe consolidation [evt-002-0021].

She received 30 mL/kg crystalloid over the first hour, vancomycin and cefepime started at 04:55, both renally adjusted by ED pharmacy [evt-002-0019, evt-002-0020]. Despite fluid resuscitation, MAP remained <65 [evt-002-0038]. ICU consult was requested at 06:25 [evt-002-0039]; she was transferred to MICU bed 8 at 06:45 [evt-002-0043]. RIJ central line and left radial arterial line were placed [evt-002-0046, evt-002-0047]. Norepinephrine was started at 0.05 mcg/kg/min through the central line [evt-002-0048].

By 08:15 mentation became more sluggish with a respiratory rate of 32 and paradoxical abdominal breathing [evt-002-0052]. HFNC was escalated to 60 L / 80% FiO2 [evt-002-0053] but repeat ABG at 08:45 showed worsening acidemia (pH 7.26) and persistent hypoxemia [evt-002-0057]. The decision was made to intubate [evt-002-0058]. She was intubated in single attempt at 09:30 with a 7.5 mm ETT secured at 22 cm [evt-002-0060]. Post-intubation ABG was reassuring (pH 7.32 / pCO2 36 / pO2 102 on FiO2 1.0) [evt-002-0067]; FiO2 has been weaned to 0.6 with stable saturation [evt-002-0070]. Post-intubation CXR confirmed appropriate ETT and CVC positions [evt-002-0073].

## Past medical history
T2DM, HTN, HFpEF, CKD stage 3a, GERD, former smoker (20 pack-years).

## Past surgical history
Cholecystectomy 2008. Hysterectomy with BSO 1998.

## Medications (home)
Metformin, amlodipine, losartan, furosemide, omeprazole, atorvastatin, ASA 81. All antihypertensives and diuretic held; metformin held given AKI.

## Allergies
NKDA.

## Social history
Lives at home with husband; baseline ambulatory with cane; independent in basic ADLs. Former smoker, quit 2012. No alcohol.

## Family history
Non-contributory to current presentation.

## Physical exam (post-intubation, sedated to RASS −3)
- Vitals: HR 102, BP 112/64 (MAP 80), SpO2 97 on FiO2 0.6, T 37.9, on norepinephrine 0.05 mcg/kg/min
- General: sedated, intubated, ventilated
- HEENT: ETT at 22 cm at lip; pupils 3 mm bilaterally and reactive [evt-002-0065]
- Cardiovascular: regular rhythm, no murmur; RIJ CVC dressing dry and intact; left radial art line waveform good
- Pulmonary: ventilator breaths bilaterally; coarse rhonchi on the right; left clear
- Abdomen: soft; OG tube in place to low intermittent suction
- Extremities: warm, capillary refill 3 seconds; no edema; SCDs in place
- Neurologic: RASS −3 on propofol/fentanyl; CAM-ICU not assessable [evt-002-0065]
- Skin: intact

## Data summary
- WBC 18.2, Hgb 11.4, plt 198 [evt-002-0023]
- BMP: Na 134, K 4.1, CO2 18, BUN 38, Cr 2.1, glucose 198, AG 18 [evt-002-0024]
- Lactate 3.8 [evt-002-0025]
- Procalcitonin 4.2 [evt-002-0026]
- ABG sequence: 7.31/32/64 on 4 L NC [evt-002-0030] → 7.26/38/62 on HFNC 60 L 80% [evt-002-0057] → 7.32/36/102 on AC/VC FiO2 1.0 [evt-002-0067]
- CXR: RLL consolidation, ETT and CVC in good position [evt-002-0021, evt-002-0073]
- Cultures: blood x 2 and urine pending [evt-002-0013, evt-002-0015]

## Assessment and plan by problem
1. **Septic shock from severe community-acquired pneumonia** [evt-002-0003]
   - Vancomycin and cefepime continued; pharmacy renal-dose review pending [evt-002-0010, evt-002-0011]
   - Norepinephrine titrated to MAP ≥ 65 [evt-002-0044]
   - Trend lactate q4-6h until <2; repeat lactate due this afternoon [evt-002-0069]
   - Reassess fluid responsiveness q6h
2. **Acute hypoxemic respiratory failure, intubated** [evt-002-0004]
   - Lung-protective ventilation (TV 6 mL/kg PBW); wean FiO2 to <0.5 as tolerated [evt-002-0069]
   - Daily SAT/SBT screening once hemodynamically off pressors
3. **Acute kidney injury on CKD 3a** [evt-002-0027]
   - Hold metformin, losartan, furosemide
   - Strict I&O via Foley; UOP target ≥ 0.5 mL/kg/hr
   - Trend Cr daily; avoid nephrotoxins
4. **Sedation/analgesia**
   - Propofol + fentanyl, target RASS −2; daily SAT
5. **Prophylaxis**
   - SCDs (chemical DVT prophylaxis held pending platelet trend); famotidine; HOB ≥ 30; oral care q4h
6. **Nutrition**
   - NPO; nutrition consult for early enteral feeding once stable

## Code status
Full code; husband is HCP.
