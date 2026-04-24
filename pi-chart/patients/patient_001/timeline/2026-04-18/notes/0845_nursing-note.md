---
id: note_20260418T0845_sbar
type: communication
subtype: sbar
subject: patient_001
encounter_id: enc_001
effective_at: '2026-04-18T08:45:00-05:00'
recorded_at: '2026-04-18T08:45:10-05:00'
author:
  id: pi-agent
  role: rn_agent
  run_id: run_20260418T0845
source:
  kind: agent_synthesis
  ref: run_20260418T0845
references:
  - evt_20260418T0815_01
  - evt_20260418T0830_01
  - evt_20260418T0830_02
status: final
---

# SBAR — respiratory status update

## Situation
Patient in bed 3A, admitted 2026-04-18 with community-acquired pneumonia. Over
the last 45 minutes, SpO2 has trended from 94% to 89% on 2L NC; HR from 88 to
108; RR from 18 to 24. Patient reports increased work of breathing since
waking.

## Background
Baseline SpO2 ~94% on room air at outpatient visits; former smoker, quit 2018.
Admission antibiotics: levofloxacin + azithromycin (selected to avoid
beta-lactam given penicillin anaphylaxis). Full code. No prior respiratory
decompensations this encounter.

## Assessment
Trend consistent with progressing hypoxia. Patient remains conversational
without accessory muscle use, but trajectory is concerning and does not yet
meet rapid-response criteria. Differential includes worsening pneumonia,
mucus plugging, and less likely new PE.

## Recommendation
Request bedside evaluation and consider titrating supplemental oxygen.
Continue close monitoring. Active escalation plan (see
`evt_20260418T0830_02`) sets triggers at SpO2 <88% sustained, RR >28, or
accessory muscle use.
