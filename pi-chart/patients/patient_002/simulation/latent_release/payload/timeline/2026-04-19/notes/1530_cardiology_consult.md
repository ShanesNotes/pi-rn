---
id: note-002-cards-001
type: communication
subtype: consult_note
subject: patient_002
encounter_id: enc-002-001
effective_at: "2026-04-19T15:30:00-05:00"
recorded_at: "2026-04-19T16:00:00-05:00"
author:
  id: cardiology_attending
  role: md
source:
  kind: clinician_chart_action
  ref: cardiology_consult
status: final
links:
  supports:
    - evt-002-h004-003
    - evt-002-0024
    - evt-002-0042
    - evt-002-0168
---

# Cardiology consult — 2026-04-19

## Reason for consult
Volume management in HFpEF in the setting of septic shock and
aggressive crystalloid resuscitation. Goal volume status assessment
and recommendations for further fluid management.

## I am the patient's established outpatient cardiologist
She has been my patient since her initial HFpEF diagnosis during
hospitalization in 2022 [enc-002-h001], and I last saw her
2025-08-05 [enc-002-h004] with a stable echo (EF 58%, grade 1
diastolic dysfunction, mild concentric LVH; LAVI improved from her
2022 study) [art-002-img-005]. At that visit she was asymptomatic
NYHA class II.

## HPI
68-year-old woman with HFpEF, T2DM, HTN, and CKD 3a now admitted
with severe community-acquired pneumonia and septic shock. She has
received approximately 2.5 L of crystalloid in the ED for resuscitation
and is now on a fixed-dose norepinephrine infusion at 0.05
mcg/kg/min via central line [evt-002-0048]. She underwent intubation
at 09:30 for hypoxemic respiratory failure [evt-002-0062] and is
currently on AC/VC at TV 380, PEEP 8, FiO2 0.6 [evt-002-0071].

I have personally reviewed the bedside POCUS performed by the ICU
team plus my own focused assessment.

## Bedside echo findings
- LV global systolic function preserved with EF estimated at ~58%,
  similar to her recent outpatient study.
- No new regional wall motion abnormalities.
- Mild concentric LVH unchanged from her baseline.
- IVC plethoric (consistent with active resuscitation phase rather
  than worsening LV function); LV size normal.
- No pericardial effusion.
- Trace MR/TR; no significant valvular changes.

## Key labs this admission
- BNP 1245 today (vs. baseline ~98 in 2025-08 [art-002-lab-008]).
  This degree of elevation is non-specific in the setting of acute
  sepsis and AKI; cannot be cleanly attributed to volume status alone.
- Troponin negative.
- Lactate trending down (admission 4.6 → 3.8 → 2.4 over the day per
  serial measurements; see `artifacts/labs/key_trajectories.json`);
  hemodynamic resuscitation is having its intended effect.

## Assessment
1. **HFpEF, currently compensated.** Despite ~2.5 L of resuscitative
   fluids, her LV function is preserved, there is no clinical
   pulmonary edema beyond what is attributable to her CAP, and her
   filling pressures by IVC are appropriate for the resuscitation
   phase. She is tolerating necessary volume well. Her chronic
   diastolic dysfunction is grade 1 by her recent outpatient echo
   [art-002-img-005].
2. **Septic shock with adequate volume responsiveness.** Lactate is
   clearing and pressor requirement is modest and stable.
3. **AKI on CKD 3a** — defer to nephrology (consulted in parallel
   today [evt-002-0166]).

## Recommendations
1. **Continue current resuscitation strategy.** HFpEF at her baseline
   does not contraindicate adequate fluid resuscitation in septic
   shock. Aim for euvolemia; do not avoid necessary fluids out of
   concern for HFpEF.
2. **Reassess volume status at least daily.** Once shock resolves
   and pressors are weaning down, anticipate transitioning toward
   diuresis. I would expect this 24–72 hours from now.
3. **Hold furosemide for now**; reassess on day 2 with the team.
4. **Hold losartan and amlodipine** while requiring vasopressor —
   resume both once off vasopressors with stable BP.
5. **Continue aspirin and atorvastatin** as background therapy. No
   contraindication.
6. **No beta-blocker** — she has no maintenance beta-blocker (history
   of intolerance to metoprolol [enc-002-h001]). Will not initiate
   in this setting.
7. **No SGLT2 inhibitor right now** — her insurance approval is
   still pending outpatient and this is not the right setting.
8. **No need for CCU transfer** — her cardiac status is stable; she
   is appropriately managed in the medical ICU.

## Plan
Will follow daily during this admission. Outpatient cardiology
follow-up at 4–6 weeks post discharge.
