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
  - evt_20260418T0842_02
  - evt_20260418T0843_01
  - evt_20260418T0844_01
status: final
---

# SBAR — respiratory status update

## Situation
Patient in bed 3A, admitted 2026-04-18 with community-acquired pneumonia. Over the last 45 minutes, SpO2 trended from 94% to 89% on 2L NC with HR from 88 to 108 and RR from 18 to 24. After provider orders, oxygen was increased to 3 L/min. The focused reassessment shows only partial response: SpO2 91-92%, RR 23, speaking full sentences, productive cough, no accessory muscle use, and persistent dyspnea with repositioning [evt_20260418T0842_02].

## Background
Baseline SpO2 ~94% on room air at outpatient visits; former smoker, quit 2018. Admission antibiotics: levofloxacin + azithromycin (selected to avoid beta-lactam given penicillin anaphylaxis). Full code. Point-of-care labs show leukocytosis without lactic acidosis or ventilatory failure [evt_20260418T0842_01].

## Assessment
Trend is improving but unresolved after oxygen titration [evt_20260418T0843_01]. Patient remains conversational without accessory muscle use, but still needs repeat nursing reassessment because worsening pneumonia or mucus plugging could still declare itself.

## Recommendation
Keep respiratory-watch loop active after this SBAR. Continue close monitoring and notify provider for SpO2 below 90%, RR above 26, accessory muscle use, fever spike, or increased confusion [evt_20260418T0844_01].
