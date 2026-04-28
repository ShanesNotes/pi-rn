---
id: note-002-008
type: communication
subtype: pharmacy_note
subject: patient_002
encounter_id: enc-002-001
effective_at: "2026-04-19T12:00:00-05:00"
recorded_at: "2026-04-19T12:05:00-05:00"
author:
  id: icu_pharmacy
  role: pharmacist
source:
  kind: pharmacy_workflow
  ref: renal_dosing_review
status: final
links:
  supports:
    - evt-002-0010
    - evt-002-0011
    - evt-002-0024
    - evt-002-0027
---

# ICU pharmacy note — renal dosing review

## Renal status
- Estimated CrCl ~28 mL/min (Cr 2.1, baseline 1.4) [evt-002-0024]
- AKI on CKD 3a [evt-002-0027]

## Antimicrobials
- **Vancomycin**: 25 mg/kg load (1750 mg) given in ED — appropriate reduction from 30 mg/kg given AKI. First trough at 24 h post-load (target 15-20 mcg/mL given severe pneumonia). Consider AUC-based dosing once trough returns.
- **Cefepime**: 1 g IV q12h is appropriate for CrCl <30 mL/min (normal dose 2 g q8-12h). Will reassess as renal function changes; if Cr improves to <2 will likely escalate to 2 g q12h. Monitor for neurotoxicity given accumulation risk.

## Held home medications
- Metformin: hold while AKI persists; resume only after Cr returns to baseline and clinical sepsis resolved.
- Losartan: hold for hypotension and AKI.
- Furosemide: hold for volume-depleted septic shock; reassess once euvolemic.
- Amlodipine: hold for hypotension.
- Atorvastatin and ASA 81: continue.

## Other
- Stress-ulcer prophylaxis: famotidine 20 mg IV q24h (renally adjusted from 20 mg q12h).
- DVT prophylaxis: SCDs only; chemical prophylaxis to be reassessed daily based on platelet count and bleeding risk.
- Sedation: propofol — monitor triglycerides at 48 h and CK if infusion >24 h or >40 mcg/kg/min.

## Follow-up
- Vanc trough 04:55 tomorrow.
- Daily renal-dose review while Cr changing.
