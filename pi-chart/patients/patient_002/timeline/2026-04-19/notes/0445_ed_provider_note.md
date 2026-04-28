---
id: note_20260419T0450_0445_ed_provider_note
type: communication
subtype: ed_provider_note
subject: patient_002
encounter_id: enc-002-001
effective_at: '2026-04-19T04:50:00-05:00'
recorded_at: '2026-04-19T05:50:00-05:00'
author:
  id: ed_provider
  role: md
source:
  kind: clinician_chart_action
  ref: ed_provider_note
status: final
references:
  - evt-002-0001
  - evt-002-0002
  - evt-002-0021
  - evt-002-0023
  - evt-002-0024
  - evt-002-0025
  - evt-002-0030
  - evt-002-0032
---

# ED provider note — 04:50

## HPI
68-year-old female with type 2 diabetes, hypertension, heart failure with preserved ejection fraction, and stage 3a chronic kidney disease, presenting with three days of productive cough, subjective fevers to 39 C, and progressive dyspnea on exertion. She reports rust-colored sputum and a single shaking chill yesterday evening. No chest pain, no hemoptysis, no calf swelling, no recent travel, no known sick contacts. She had not taken her morning medications today because of nausea.

She arrived to the ED at 04:10 with vitals consistent with septic shock (T 38.9, HR 118, BP 94/58, RR 28, SpO2 88% on room air) [evt-002-0001].

## Past medical history
T2DM, HTN, HFpEF (EF 58% in 2025), CKD 3a (baseline Cr 1.4), GERD, former smoker (20 pack-years, quit 2012).

## Allergies
NKDA.

## Home medications
Metformin 1000 BID, amlodipine 5, losartan 50, furosemide 20, omeprazole 20, atorvastatin 40, ASA 81.

## Physical exam
- General: appears acutely ill, flushed [evt-002-0002]
- HEENT: dry mucous membranes
- Cardiovascular: tachycardic, regular rhythm, no murmur
- Pulmonary: tachypneic with mild accessory muscle use; coarse rhonchi over right lower lobe; no wheezes [evt-002-0032]
- Abdomen: soft, non-tender
- Neurologic: alert, oriented x 3 at triage, slightly slowed responses by 05:30 [evt-002-0032]
- Skin: warm, no rash; no edema

## Data
- POC lactate 3.8 [evt-002-0018], confirmed core lab 3.8 [evt-002-0025]
- WBC 18.2 with 8% bands [evt-002-0023]
- BMP: Cr 2.1 (baseline 1.4), BUN 38, anion gap 18 [evt-002-0024]
- Procalcitonin 4.2 [evt-002-0026]
- ABG on 4 L NC: pH 7.31 / pCO2 32 / pO2 64 / HCO3 16 / SaO2 91 [evt-002-0030]
- Portable CXR: dense right lower lobe consolidation [evt-002-0021]

## Assessment and plan
1. **Septic shock, presumed pulmonary source (CAP)** [evt-002-0003]
   - 30 mL/kg crystalloid bolus over 1 hour, started 04:42 [evt-002-0016]
   - Empiric vancomycin and cefepime, both renally adjusted, started 04:55 [evt-002-0019, evt-002-0020]
   - Blood cultures x 2, urine culture, respiratory viral panel pending [evt-002-0013, evt-002-0015]
   - Repeat lactate at 4 hours; consider vasopressors if MAP <65 after fluid resuscitation
2. **Acute hypoxemic respiratory failure** [evt-002-0004]
   - Currently on 4 L NC with SpO2 92%; if work of breathing worsens or hypoxemia persists, escalate to HFNC
   - Repeat ABG with respiratory changes
3. **Acute kidney injury on CKD** [evt-002-0027]
   - Hold metformin, losartan, furosemide
   - Strict I&O; consider Foley if oliguria persists
   - Avoid nephrotoxins; monitor Cr q12h
4. **Disposition**: ICU consult requested for likely pressor and respiratory support needs.
