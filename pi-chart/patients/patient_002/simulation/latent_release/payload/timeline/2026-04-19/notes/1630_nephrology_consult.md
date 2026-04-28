---
id: note-002-neph-001
type: communication
subtype: consult_note
subject: patient_002
encounter_id: enc-002-001
effective_at: "2026-04-19T16:30:00-05:00"
recorded_at: "2026-04-19T17:00:00-05:00"
author:
  id: nephrology_attending
  role: md
source:
  kind: clinician_chart_action
  ref: nephrology_consult
status: final
links:
  supports:
    - evt-002-0024
    - evt-002-0042
---

# Nephrology consult — 2026-04-19

## Reason for consult
AKI on CKD stage 3a in the setting of septic shock. Volume management
coordination, RRT criteria assessment, contrast and renal-dosing
recommendations.

## I am the patient's established outpatient nephrologist
She has been followed by nephrology since 2021 for CKD 3a. I last
saw her on 2024-03-15 [enc-002-h002], at which time her renal function
was at her stable baseline (Cr 1.4, eGFR 42, microalbuminuria 42 mg/g
[evt-002-h002-002, evt-002-h002-003]). She has been imperfectly
followed since — the next nephrology visit was scheduled for spring
2026 but had not yet occurred.

## Etiology of AKI
This is an AKI on CKD 3a with KDIGO stage 1 criteria met (Cr 2.1
from baseline 1.4 [art-002-lab-006], representing a 1.5-fold rise).
The etiology is multifactorial:
- **Sepsis-induced acute tubular injury** is the dominant
  contribution; this is consistent with her clinical picture, the
  severity of her shock, and the proportional rise in Cr.
- **Pre-renal physiology** from distributive shock prior to
  resuscitation, now improving with volume and pressor support.
- **Recent ARB exposure** (losartan 50 mg daily) compounds the
  reduction in glomerular filtration in the setting of altered
  perfusion. Has been appropriately held [evt-002-0153].
- **No nephrotoxic medications** beyond the ARB; no recent NSAIDs;
  no contrast exposure on this admission.

## Today's renal labs and trajectory
- Cr admission 2.1 [evt-002-0024]; trajectory will be reassessed on
  evening labs and tomorrow's AM labs.
- BUN 38 → 34 over the day. Mildly disproportionate to Cr but consistent
  with combined pre-renal and ATN physiology.
- K 3.9 (corrected to 4.0 with admission repletion) → 3.6 (will
  receive further repletion tonight). Watch closely.
- HCO3 19 → 20. Anion gap closing with lactate clearing.
- pH 7.32 with appropriate respiratory compensation; not severely
  acidotic.
- UOP improving with resuscitation: ~25 mL/hr in early hours →
  ~40 mL/hr by 18:00 — still <0.5 mL/kg/hr at 65 kg but trending up.
- No dipstick evidence of glomerulonephritis.
- Microalbuminuria of 40-ish mg/g at her baseline [art-002-lab-006];
  consistent with her chronic disease.

## Assessment
1. **AKI on CKD 3a, KDIGO stage 1**, multifactorial as above.
   Trajectory is favorable in the first 12 hours of resuscitation.
2. **No current indication for renal replacement therapy.** Specifically,
   no:
   - Severe acidemia (pH 7.32 with compensation)
   - Refractory hyperkalemia (K corrected appropriately)
   - Volume overload (still in resuscitation phase)
   - Uremic complications (BUN moderate, no encephalopathy or pericarditis)
   I expect renal recovery given her baseline reserve and the fact
   that she has been following an etiologically reversible course.
3. **Underlying CKD 3a**, etiology hypertensive-diabetic nephropathy
   per prior workup [enc-002-h002].

## Recommendations
1. **Continue ARB hold** [evt-002-0153] until off vasopressors with
   stable BP and Cr trending toward baseline. Resumption decision can
   be made by primary team once these criteria met; I am happy to
   consult on the decision.
2. **Continue metformin hold** [evt-002-0152]; can resume once Cr
   stable at baseline AND patient is tolerating PO/oral.
3. **Avoid nephrotoxins**: no aminoglycosides, no NSAIDs, no IV
   contrast unless absolutely necessary. If contrast is required,
   pre-procedure isotonic crystalloid hydration and avoidance of
   simultaneous pressor weaning.
4. **Renal-adjusted dosing for antimicrobials**:
   - **Vancomycin**: continue current pharmacist-managed dosing
     [evt-002-0070]; goal trough 15–20 mcg/mL. Pharmacist is on it.
   - **Cefepime**: at present CrCl ~25, recommended dose is 1 g IV
     every 12 hours rather than 2 g every 8 hours. Note this should be
     readjusted as renal function recovers.
5. **Strict I&O** with q12h or more frequent volume status
   reassessment.
6. **Daily BMP**, with phosphorus and magnesium added to AM labs.
7. **No contraindication to bladder catheter**; preserve for accurate
   I&O during shock phase.
8. **Outpatient follow-up** at 4–6 weeks post discharge; I will see
   her in clinic.

## Plan
I will follow daily during this admission. Will round with the ICU
team at AM rounds.
