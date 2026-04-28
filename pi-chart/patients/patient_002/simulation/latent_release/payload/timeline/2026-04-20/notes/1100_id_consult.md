---
id: note-002-013
type: communication
subtype: consult_note
subject: patient_002
encounter_id: enc-002-001
effective_at: "2026-04-20T11:00:00-05:00"
recorded_at: "2026-04-20T11:30:00-05:00"
author:
  id: id_attending
  role: md
source:
  kind: clinician_chart_action
  ref: id_consult
status: final
links:
  supports:
    - evt-002-0023
    - evt-002-0026
    - evt-002-0093
    - evt-002-0095
    - evt-002-0103
---

# Infectious Disease consult — 11:00

## Reason for consult
Antibiotic guidance for severe community-acquired pneumonia with septic shock, with newly preliminary blood cultures showing single-bottle gram-positive cocci in clusters at 30 hours [evt-002-0103].

## Brief assessment
68F admitted 24h ago with severe CAP and septic shock, intubated for hypoxemic respiratory failure, now hemodynamically improving on minimal pressor support and improving renal function. WBC declining, procalcitonin had been 4.2 [evt-002-0026], CXR improving [evt-002-0095].

Single-bottle blood culture growth of GPC in clusters at 30 hours has the typical profile of a coagulase-negative staphylococcus contaminant rather than true bacteremia, particularly given:
- Single bottle of two sets positive
- Late time-to-positivity (>30 hours)
- Patient improving clinically without targeted gram-positive coverage beyond vancomycin
- No central line at the time of cultures (drawn from ED PIVs)

## Recommendations
1. **Continue current empiric coverage (vancomycin + cefepime)** until speciation and susceptibility are available, expected within 24 hours.
2. **If speciation confirms coag-neg staph in a single bottle and patient remains stable**, discontinue vancomycin. No repeat cultures required given the contaminant profile and clinical improvement.
3. **If sputum culture or other source identifies a typical CAP pathogen** (Strep pneumoniae, H. influenzae, M. catarrhalis), narrow cefepime to ceftriaxone.
4. **Total CAP antibiotic course**: 5–7 days from clinical stability (anticipated 4–6 more days based on current trajectory).
5. Avoid additional gram-negative or atypical coverage at this time — patient was admitted from home without recent healthcare exposure, and respiratory viral panel is still pending.

## Follow-up
- Available for re-consult once final speciation returns or if clinical course changes.
- Will follow daily until antibiotic plan finalized.
