---
id: note_20260418T1700_shift_change_sbar
type: communication
subtype: handoff
subject: patient_001
encounter_id: enc_001
effective_at: '2026-04-18T17:00:00-05:00'
recorded_at: '2026-04-18T17:02:00-05:00'
author:
  id: day_rn
  role: rn
source:
  kind: nurse_charted
  ref: shift_handoff
status: final
references:
  - evt_20260418T0842_02
  - evt_20260418T0932_01
  - evt_20260418T0935_01
  - evt_20260418T1015_01
  - evt_20260418T1130_01
  - evt_20260418T1135_01
  - evt_20260418T1305_01
---

# Day → night shift change SBAR — 17:00

**Situation.** Hospital day 1 of a community-acquired pneumonia admission. The chart anchor finding is the focused respiratory reassessment after oxygen titration — SpO2 91-92% on 3 L/min, RR 23, productive cough, no accessory muscle use at rest, persistent dyspnea with repositioning [evt_20260418T0842_02].

**Background.** Day shift closed the morning respiratory-watch loop after the 09:30 focused reassessment confirmed sustained partial response [evt_20260418T0932_01], rolled the patient onto a q4h monitoring plan through this handoff [evt_20260418T0935_01], and resolved a 10:00 RT independent exam that initially appeared to contradict the 08:42 RN finding (both consistent in clinical context — at-rest exam clean, deep-inspiration exam shows mild accessory use during pneumonia recovery) [evt_20260418T1015_01]. Antibiotics started: levofloxacin 750 mg IV at 11:30 and azithromycin 500 mg IV at 11:35; class hold on all beta-lactams in place per penicillin-anaphylaxis allergy guard [evt_20260418T1130_01, evt_20260418T1135_01].

**Assessment.** Afternoon trajectory is improving: 13:00 vitals show SpO2 94% on 3L NC, RR 19, HR 92, temperature down to 37.6 C from 38.1 C this morning, work of breathing unlabored at rest [evt_20260418T1305_01]. Patient ambulating to the bathroom with assistance; appetite returned for soft dinner.

**Recommendation for night shift.**

- Continue 3 L NC; titrate down only if SpO2 sustains above 96% on room air at rest.
- Continue q4h vitals and focused respiratory exam through 21:00 and 01:00; document SpO2, RR, HR, temperature, work of breathing.
- Notify provider for SpO2 below 90%, RR above 26, new accessory muscle use at rest, temperature above 39.0 C, or HR above 115.
- Hold all beta-lactam orders by allergy guard; alternative coverage (levofloxacin + azithromycin) continues per pharmacy med-rec note.
- AM repeat labs and AM CXR drawn / acquired before 08:00 per overnight plan.
- Spouse updated this afternoon at 16:30; preferred update channel is phone callback to the unit.
