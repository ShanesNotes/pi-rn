---
id: note-002-017
type: communication
subtype: consult_note
subject: patient_002
encounter_id: enc-002-001
effective_at: "2026-04-21T10:30:00-05:00"
recorded_at: "2026-04-21T10:45:00-05:00"
author:
  id: id_attending
  role: md
source:
  kind: clinician_chart_action
  ref: id_followup
status: final
links:
  supports:
    - evt-002-0103
    - evt-002-0121
    - evt-002-0124
    - evt-002-0129
---

# Infectious Disease follow-up — 10:30

## Interval events
- Hospital day 3, post-extubation at 08:30 [evt-002-0124]; alert and oriented x 3, hemodynamically stable, off pressors >24 hours.
- WBC down to 11.2 [evt-002-0121]; afebrile. Respiratory viral panel is negative [evt-002-0147].
- Blood culture speciation returned: coagulase-negative staphylococcus from a single bottle of one set, drawn from a peripheral PIV in the ED [evt-002-0129]. Susceptibilities not performed by the lab given the contaminant profile.

## Assessment
Single-bottle coagulase-negative staph in a patient with a clear pulmonary source of sepsis, no central line at the time of culture, and rapid clinical improvement on empiric coverage is consistent with a skin contaminant rather than true bacteremia. No further blood cultures required.

The respiratory viral panel returned negative. No specific pathogen identified for the pneumonia, which is the most common scenario in CAP. Given the favorable trajectory, narrowing to ceftriaxone is appropriate empiric coverage for typical CAP.

## Recommendations
1. **Discontinue vancomycin** today — contaminant.
2. **Discontinue cefepime** today — narrow.
3. **Start ceftriaxone 1 g IV q24h** to complete a 5-day total course from clinical stability (admission was 04/19; clinical stability 04/20; planned end-of-therapy 04/24).
4. **No need for repeat blood cultures** unless new fever, hemodynamic instability, or other clinical concern.
5. **No need for follow-up imaging** unless clinical deterioration; outpatient follow-up CXR in 4–6 weeks is reasonable to confirm radiographic resolution.

## Sign-off
Signing off from ICU service. Will resume consult if requested for any new infectious concerns.
