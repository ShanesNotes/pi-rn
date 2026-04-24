---
id: note_20260419T0930_handoff
type: communication
subtype: handoff
subject: patient_002
encounter_id: enc_p002_001
effective_at: "2026-04-19T09:30:00-05:00"
recorded_at: "2026-04-19T09:30:00-05:00"
author:
  id: pi-agent
  role: rn_agent
  run_id: run_p002_0930
source:
  kind: agent_synthesis
  ref: run_p002_0930
references:
  - evt_p002_0905_wob
  - evt_p002_0925_abg_result
  - evt_p002_0927_assess_response
  - evt_p002_0930_care_plan
  - evt_p002_0930_handoff_comm
status: final
---

Next-shift handoff: ABG/lactate has resulted, but the same bedside work-of-breathing finding remains the anchor for the watch item. Reassess SpO2, RR, and accessory muscle use by 09:50; escalate if SpO2 stays below 90% or RR remains 30 or higher.
