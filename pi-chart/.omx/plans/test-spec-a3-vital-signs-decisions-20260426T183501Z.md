# Test Spec — A3 Vital Signs Decision Implementation Bridge

## Scope

This test spec validates implementation of the seven confirmed A3 vital-sign decisions across schema/types, views, validators, fixtures, and ingest-boundary contract.

## Contract Freeze Tests (Stage 0.5)

Before broad implementation, add/record contract tests or fixtures for:

- `sampled_at` as measurement time and `recorded_at` as chart-ingest/write time.
- Deterministic `sample_key` formula: `vital_<sha256(subject|encounter_id|name|sampled_at|source.kind|source.ref?|normalized_value|unit?)[:16]>`, where `normalized_value` uses finite decimal strings for numbers, trimmed NFC strings, and `true`/`false` for booleans; deterministic ordinal suffix plus warning on true collision.
- `currentState(axis:"context")` shape and `axis:"all"` additive context field.
- Open-loop variants `kind:"vital_cadence"` and `kind:"vital_alarm"`, preferably backed by `intent.monitoring_plan` but not requiring per-frame event materialization.
- Severity matrix: live=openLoop, replay=warn, strict replay=error for deterministic cadence/alarm misses.
- pi-chart-owned adapter fixture: one representative sim frame maps to one expected chart vitals row without importing pi-sim internals.

## Test Strategy

Layered tests should lock behavior before strict enforcement:

1. Schema/type tests for accepted canonical shapes and migration-compatible legacy shapes.
2. View tests for context axis, latest vitals, trend filtering, open loops, and derived score/alarm behavior.
3. Validator tests for error/warning rules and evidence resolution.
4. Fixture/integration tests for patient examples and derived outputs.
5. Adapter contract tests for pi-sim → pi-chart mapping via pi-chart-owned adapter contract fixture before any pi-sim coupling.

## Acceptance Test Matrix

| Decision | Test area | Required coverage |
|---|---|---|
| D1 oxygen context | `currentState`, validator, fixtures | Active context segment is canonical; inline disagreement warns; SpO₂ without inline or segment warns/errors per rule; `axis:"context"` and `axis:"all"` expose context. |
| D2 alarm/artifact | schema, openLoops, validator | Derived live alarm state does not create per-frame events; sustained/actioned/audit alert is schema-valid; consequential device_artifact can resolve/explain; alarm_pause suspends/resolves obligation. |
| D3 sample identity | schema, validator, evidence/trend | sample_key follows the exact formula and deterministic collision handling; vitals windows still resolve; summary-window event allowed; no new URI link kinds required. |
| D4 cadence/staleness | openLoops, fixtures | monitoring_plan/order cadence drives baseline; alarm can activate temporary q15-style obligation; live misses open loops; replay warns; strict replay errors when deterministic. |
| D5 scores | views, validator | live score is derived only; acted-on risk_score with algorithm/version/snapshot/supports validates; threshold crossing without response can open loop. |
| D6 ingest | adapter contract | sim frame maps to chart row with names/units/context/quality/sample_key/source; encounter_id resolved by chart/tool scope; cross-patient writes rejected. |
| D7 registry/shared metrics | schema, trend, fixtures | metric names validated against registry; ABG/lactate/Hgb treated as A1 canonical unless profile/training-labeled; trend avoids silent misleading union. |

## Unit Tests

- `src/types.test.ts`: Axis includes `context`; CurrentState union covers context/all context shape; VitalSample accepts structured quality and sample_key.
- `src/schema.test.ts`: canonical vitals row with `recorded_at`, `sample_key`, structured quality passes; legacy scalar quality is accepted or warned during migration if validation layer, not JSON schema, owns compatibility.
- `src/views/currentState.test.ts`: active context segment selection; superseded/corrected context excluded; inline context does not override active segment.
- `src/views/trend.test.ts`: invalid structured-quality samples excluded; questionable retained; sample_key preserved if exposed; source/profile filtering for simulator ABG-like values.
- `src/views/openLoops.test.ts`: ordered cadence miss, typed `vital_cadence`/`vital_alarm` loops, alarm-triggered temporary obligation, alarm_pause, resolution/clearance, no per-frame event requirement.
- `src/validate.test.ts`: V-VITAL rules for oxygen context, metric registry, sample_key, invalid-only vitals window, risk_score payload, alert/device_artifact/alarm_pause allowed usage.
- `src/evidence.test.ts`: existing `vitals://` support remains unchanged; summary-window event support if helper logic is added.

## Integration / Fixture Tests

Create or update fixtures to include:

1. Stable ward vitals with room-air context segment and q4h monitoring plan.
2. Pneumonia deterioration trend with SpO₂/RR/HR windows and active oxygen segment.
3. Stale monitoring plan creating OL-VITAL cadence miss.
4. Invalid pulse-ox artifact retained in stream and excluded from latest/trend; consequential artifact event only when workflow was affected.
5. Conflicting monitor vs RN manual vital where correction/refutation references sample_key or summary window.
6. Alarm-triggered temporary q15 reassessment obligation and resolution.
7. Acted-on risk_score assessment with parameter snapshot and supports.
8. Simulator ABG-like value profile/training label and A1 canonical lab counterpart.

## Verification Commands

Use package scripts from `package.json`; expected candidates:

```bash
npm test
npm run validate
npm run rebuild
```

If package scripts differ, use the project’s existing test invocation and record exact commands in the implementation report.

## Non-goals for Testing

- Do not require external clinical policy validation for q15/q1h examples.
- Do not test UI rendering/styling.
- Do not require pi-sim internal source changes unless a selected execution lane explicitly owns adapter implementation.

## Exit Criteria

- All new behavior has at least one failing-then-passing test or fixture assertion.
- Existing `currentState`, `trend`, `evidenceChain`, `validate`, and fixture tests pass.
- Docs/ADR and tests agree on severity matrix: live open loops, replay warnings, strict-replay errors or an explicit note that replay strictness awaits a validation CLI/API option for deterministic misses.
- Migration compatibility for legacy vitals rows is explicitly tested or documented as intentionally dropped.
