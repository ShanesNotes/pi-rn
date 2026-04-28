---
id: derived-002-projection-2026-04-20T07:00
type: derived
subtype: memory_projection
subject: patient_002
encounter_id: enc-002-001
projection_at: "2026-04-20T07:00:00-05:00"
recorded_at: "2026-04-20T07:00:00-05:00"
window:
  start: "2026-04-19T04:10:00-05:00"
  end: "2026-04-20T07:00:00-05:00"
author:
  id: agent
  role: derived
source:
  kind: derived_from_events
  ref: timeline/2026-04-19/events.ndjson + timeline/2026-04-20/events.ndjson (through evt-002-0097)
status: snapshot
---

# Memory projection — patient_002 — 2026-04-20 07:00 (handoff snapshot)

This is a derived view composed by the synthesis layer at the moment of
the day-2 night-to-day handoff. It is computed exclusively from event
stream entries up to `evt-002-0097`. Every claim is anchored to the
event(s) that supports it.

## One-line summary
68F hospital day 2 of severe community-acquired pneumonia with septic
shock and AKI on CKD; intubated and ventilated for hypoxemic respiratory
failure; clinically improving with hemodynamics, oxygenation, and renal
function all trending favorably.

## What changed in the last 12 hours
- **Lactate normalized** from 2.4 to 1.6 mmol/L — septic shock
  resuscitation is responding [evt-002-0079, evt-002-0091].
- **WBC declining** from 18.2 to 14.8 with elevated bands at admission
  [evt-002-0023, evt-002-0093].
- **Cr improving** from 2.1 to 2.0 to 1.7, baseline 1.4 — AKI is
  resolving without renal replacement therapy [evt-002-0024,
  evt-002-0086, evt-002-0093].
- **Vancomycin trough 17.4 mcg/mL — in target range** for severe
  pneumonia [evt-002-0092].
- **CXR shows interval improvement** of the right lower lobe
  consolidation [evt-002-0095].
- **Norepinephrine weaned** from 0.05 to 0.04 mcg/kg/min with sustained
  MAP 76–82 [evt-002-0048, vitals 2026-04-20 night shift].

## Why
The combination of timely empiric antibiotics (vancomycin and cefepime,
both renally adjusted within 45 minutes of arrival
[evt-002-0019, evt-002-0020]), 30 mL/kg crystalloid resuscitation
[evt-002-0016], pressor support to MAP ≥ 65 [evt-002-0048], lung-protective
ventilation post-intubation [evt-002-0061], and avoidance of nephrotoxins
has produced clinical improvement consistent with a single bacterial
pulmonary source responding to therapy.

## Evidence anchors
- Septic shock from CAP: WBC 18.2 with bands [evt-002-0023], procalcitonin
  4.2 [evt-002-0026], lactate 3.8 [evt-002-0025], CXR with right lower
  lobe consolidation [evt-002-0021], MAP <65 despite fluid bolus
  [evt-002-0038].
- Acute hypoxemic respiratory failure: ABG sequence 7.31/32/64 → 7.26/38/62
  → 7.32/36/102 across NC → HFNC → vent [evt-002-0030, evt-002-0057,
  evt-002-0067].
- AKI on CKD: Cr 2.1 vs baseline 1.4 [evt-002-0024]; trending toward
  baseline [evt-002-0093].
- Response to therapy: lactate clearing [evt-002-0079, evt-002-0091],
  WBC down [evt-002-0093], CXR improved [evt-002-0095].

## Uncertainty
- **Pathogen unidentified.** Blood cultures pending [evt-002-0013];
  urine culture pending [evt-002-0015]; respiratory viral panel pending.
  Empiric coverage may be over-broad.
- **Sedation interpretation.** RASS −2 to −3 is intentional but means
  CAM-ICU cannot be assessed [evt-002-0065]; delirium status is unknown.
- **Volume status.** Patient is +3,420 mL net since admission with
  improving but not yet normalized UOP. Whether further negative fluid
  balance will be tolerated as pressors are weaned is not yet known.

## Pending
- Blood culture and urine culture finalization.
- Respiratory viral panel.
- ID consult later this morning per attending plan.
- Pharmacy daily renal-dose review at 12:00.
- Daily SAT/SBT screening to begin once off pressors and FiO2 ≤ 0.4.
- Tube feed initiation pending stable trajectory at AM rounds.

## Next watch (12 h)
- **Hemodynamics off pressors:** if norepinephrine comes off today, watch
  for MAP <65 in the first 4 hours [orders evt-002-0044].
- **Respiratory:** continue FiO2 wean toward ≤ 0.4; watch for desaturation
  or rising plateau pressure as PEEP and TV remain fixed.
- **Renal:** if Cr continues improving, plan to escalate cefepime to 2 g
  q12h once Cr <1.6; monitor UOP target ≥ 0.5 mL/kg/hr.
- **Sedation:** lighten propofol toward RASS −1 today; daily SAT in AM
  tomorrow; reassess CAM-ICU once light enough.
- **Cultures:** any growth from blood or urine should prompt immediate
  re-evaluation and possible antibiotic change.
- **CXR:** repeat tomorrow AM; concern for new consolidation, ARDS
  pattern, or pneumothorax should escalate.

## Held home medications (snapshot)
- metformin (AKI)
- losartan (AKI, hypotension)
- furosemide (volume-depleted)
- amlodipine (hypotension)
- continued: omeprazole (replaced by famotidine IV), atorvastatin, ASA 81

## Code status
Full code; husband HCP.
