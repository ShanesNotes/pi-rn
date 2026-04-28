---
id: derived-002-current-state-2026-04-21T20:00
type: derived
subtype: current_state_snapshot
subject: patient_002
encounter_id: enc-002-001
projection_at: "2026-04-21T20:00:00-05:00"
recorded_at: "2026-04-21T20:00:00-05:00"
author:
  id: agent
  role: derived
source:
  kind: derived_from_events
  ref: timeline/2026-04-19/events.ndjson + timeline/2026-04-20/events.ndjson + timeline/2026-04-21/events.ndjson
status: snapshot
---

# Current state snapshot — patient_002 — 2026-04-21 20:00

Derived view only. Source of truth remains the event stream, vitals, notes, and artifacts.

## One-liner
68F with severe community-acquired pneumonia complicated by septic shock, AKI on CKD 3a, and hypoxemic respiratory failure requiring intubation 04-19 09:30; extubated 04-21 08:30, off pressors >24 h, renal function back to baseline, on HFNC 20 L / 30%, narrowed to ceftriaxone, planned for step-down/floor transfer in AM if stable overnight.

## Patient context anchors (pre-admission)
| Domain | Baseline | Source |
|---|---|---|
| Cardiac | HFpEF, EF 58%, grade 1 diastolic dysfunction, NYHA II at baseline | art-002-img-005 (echo 2025-08-05) |
| Renal | CKD 3a, baseline Cr 1.4, eGFR ~42 by CKD-EPI | art-002-lab-006 (longitudinal renal trajectory) |
| Glycemic | T2DM since 2009, A1c 7.2% (2025-09), on metformin (held this admission) | art-002-lab-005 |
| BP | Office 148/82, home avg 138/78 on amlodipine + losartan (both held this admission) | enc-002-h005 (2025-09-15 PCP) |
| Code status | Full code; husband is HCP | evt-002-h005-009 |

## Active problems

| Problem | Current state | Evidence |
|---|---|---|
| Severe CAP | Improving; RLL consolidation improved on 04-20 CXR, viral panel negative, blood culture contaminant | evt-002-0095, evt-002-0129, evt-002-0147 |
| Septic shock | Resolved; norepinephrine wean 0.05 -> 0.04 -> 0.03 -> 0.02 -> off 04-20 16:00 | evt-002-0186, evt-002-0101, evt-002-0187, evt-002-0108 |
| Acute hypoxemic respiratory failure | Extubated 2026-04-21 08:30; stable on HFNC 20 L / 30% | evt-002-0124, evt-002-0135, evt-002-0136 |
| AKI on CKD 3a | Resolved to baseline Cr 1.4 | evt-002-0121 |
| Stress hyperglycemia (background T2DM) | Improved; sliding-scale insulin requirement decreasing as stress resolves | evt-002-0151, evt-002-0190 |
| HFpEF in resuscitation phase | Compensated through resuscitation per 04-19 cardiology consult; no pulmonary edema beyond CAP | evt-002-0166, evt-002-h004-003 |
| Post-extubation airway | Mild hoarseness, no stridor; SLP cleared regular soft diet 04-21 11:30 | evt-002-0128, evt-002-0193 |
| Medication de-escalation | Vancomycin/cefepime stopped 04-21 12:00, ceftriaxone started; metformin/losartan/furosemide held | evt-002-0131, evt-002-0134 |

## Devices and lines

| Device | Status | Evidence |
|---|---|---|
| ETT | Removed 2026-04-21 08:30 | evt-002-0124 |
| Oxygen | HFNC 20 L / 30% as current context through chart stop | evt-002-0135, evt-002-0136 |
| Arterial line | Removed 2026-04-21 14:00 | evt-002-0137 |
| RIJ CVC | Still present at 19:00; planned removal AM after PIV access established | evt-002-0144, evt-002-0139 |
| Foley | Still present | evt-002-0144 |
| OG tube | Removed 2026-04-21 16:30 | evt-002-0142 |
| SCDs | In place bilateral lower extremities for VTE prophylaxis; heparin SC added 04-21 once stable | evt-002-0159, evt-002-0174, evt-002-0195 |

## Active medications (event-stream view)
See `artifacts/mar/mar_snapshot_2026-04-21T20-00.json` for full MAR detail.

Brief: ceftriaxone (active, q24h), amlodipine (resumed 04-21), heparin SC q8h (started 04-20), atorvastatin 40 mg (continued via OG -> PO), aspirin 81 mg (continued via OG -> PO), famotidine (continuing for now), insulin sliding scale (q4h), omeprazole (held in favor of famotidine while NPO/intubated, plan to resume PO with diet).

## Held home medications
- metformin — sepsis/AKI; reassess at discharge or once stable renal function maintained
- losartan — held during shock/AKI; plan to resume 04-22 if BP stable
- furosemide — held during shock and AKI; reassess on transfer
- omeprazole — held during NPO/intubated period; plan to resume PO at discharge

## Multidisciplinary input received this admission
- Cardiology (Dr. Okafor, established outpatient): consult 04-19 15:30 [evt-002-0166]
- Nephrology (Dr. Hanrahan, established outpatient): consult 04-19 16:30 [evt-002-0169]
- Infectious diseases: consult 04-20 11:00 [evt-002-0095], follow-up 04-21 [evt-002-0130]
- Nutrition: consult 04-20 13:00 [note 1300_nutrition_consult.md]
- Speech-language pathology: post-extubation swallow eval 04-21 11:30 [evt-002-0193]
- Physical/occupational therapy: initial eval 04-21 13:00 [evt-002-0195]
- Case management: transfer planning 04-21 16:00 [evt-002-0198]
- Pharmacy: ICU admission med-rec 04-19 12:00, renal-dosing review

## Next-watch items
- Respiratory: wean HFNC toward NC overnight; watch RR, accessory muscles, SpO2
- Post-extubation airway: hoarseness should improve in 24–48 h; escalate if stridor or worsening
- Hemodynamics: BP stability after amlodipine resumed; losartan add-back tomorrow if stable
- Renal: continue baseline-Cr trend; reassess metformin/furosemide at discharge
- Glycemic: continue sliding-scale insulin; transition off as PO intake advances
- Lines: remove RIJ CVC and Foley once PIV established and mobility plan active
- Mobility: PT plan progressing; first OOB to chair 04-22 AM per PT note
