# Deep Interview Transcript — A3 Vital Signs Decisions

## Metadata

- Profile: standard
- Context type: brownfield
- Final ambiguity: 8%
- Threshold: 20%
- Context snapshot: `.omx/context/a3-vital-signs-decision-interview-20260426T181414Z.md`
- Direct implementation: none

## Rounds and answers

1. **Oxygen-delivery context**
   - Selected: `segment-canonical-axis-context`
   - Decision: Inline SpO₂ context remains allowed during migration/read convenience; active `observation.context_segment{segment_type:"o2_delivery"}` is canonical; disagreement warns; add `currentState(axis:"context")`.

2. **Alarm/artifact architecture**
   - Selected: `hybrid-derived-plus-audit-events`
   - Decision: Live alarm state is derived; sustained/actioned/audit-relevant alert episodes become canonical events; invalid samples remain in `vitals.jsonl` with structured `quality.{state, flags}`; `device_artifact` is emitted only when consequential; `action.alarm_pause` remains canonical.

3. **Stream identity/correction/fulfillment**
   - Selected: `sample-key-plus-window-summary`
   - Decision: Add deterministic `sample_key`; retain `vitals://` windows for normal evidence; allow optional `observation.vital_sign.data.summarizes_window` when a disputed/fulfilled window deserves event-level representation; avoid new URI link kinds for now.

4. **Cadence/staleness policy**
   - Initial answer: monitoring should follow orders, with q15 pings acceptable and monitoring triggered by alarm event.
   - Follow-up selected: `orders-baseline-alarms-trigger-temporary-plan`
   - Decision: Baseline cadence follows explicit orders/`intent.monitoring_plan`; alarm episodes can create/activate temporary reassessment/monitoring obligations, e.g. q15 until cleared/resolved. Live misses are open loops rather than invalid chart state; replay/strict replay can increase severity.

5. **Early-warning scores**
   - Selected: `derived-live-store-acted-on`
   - Decision: Compute NEWS2/MEWS/qSOFA live as derived state; store `assessment.risk_score` only when asserted, reviewed, or acted on, with algorithm/version/score/parameter snapshot/time basis/evidence; threshold crossings without required review/response can open loops.

6. **pi-sim vitals ingest boundary**
   - Selected: `adapter-translates-chart-resolves-encounter`
   - Decision: pi-chart ingest adapter maps pi-sim VitalFrame fields into chart vitals schema; pi-sim remains source/public interface; chart/tool scope resolves `encounter_id` from PatientScope/session/chart.yaml unless explicitly supplied by the chart tool boundary.

7. **Vital metric registry and shared metrics**
   - Selected: `registry-now-a1-canonical-profile-routed-sim`
   - Decision: Add a canonical vital metric registry now. Drawn ABG/lactate/Hgb remain A1-canonical lab observations. A3 may carry simulator-derived ABG-like values only when explicitly profile-routed/training-labeled.

## Readiness gates

- Non-goals: explicit — no implementation in deep-interview.
- Decision boundaries: explicit — GPT recommendations were presented; user confirmed/modified choices.
- Pressure pass: complete — cadence answer was pressure-tested into an order-baseline + alarm-triggered temporary-plan rule.
