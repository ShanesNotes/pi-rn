# pi-sim → pi-chart vitals write contract (Lane A)

Status: draft v0. Stabilizes the wire format pi-sim's `monitor.ts` will speak to pi-chart's localhost ingest endpoint. The pi-sim agent working ADR 002 implements the **B1 translator** against this contract.

Companion artifacts:
- `pi-chart/.omc/specs/deep-interview-pulse-vitals-stream-arch-26042026.md` — full Lane D spec.
- `pi-chart/memos/pi-chart-vitals-connector-unblock-plan-26042026.md` — four-lane plan.
- `pi-sim/docs/adr/002-pi-sim-as-patient-three-stream-topology.md` — upstream ADR §Subsystems #2.

## Scope

Defines:
- HTTP route, method, body
- Sample shape, required vs optional fields
- Canonical `source.kind` (per ADR 006)
- Idempotency rule
- Error responses
- Encounter-close behavior

Does **not** define (lives in other lanes):
- pi-chart-side latent buffer file path conventions (Lane D spec).
- `chart_state: latent | charted` field placement (Lane B ADR).
- Promotion semantics (Lane C ADR).
- Auth / TLS / rate limits (single-user localhost demo).

## Endpoint

```
POST  http://<pi-chart-host>:<port>/vitals/:patientId/:encounterId/ingest
Content-Type: application/json
```

- `<pi-chart-host>:<port>` configured on pi-sim side via env `PI_CHART_INGEST_URL`. Default to `http://127.0.0.1:7878` for the prototype (port subject to change before Lane D ships).
- `:patientId` and `:encounterId` are URL path params. Both required. pi-sim must read them from its scenario manifest or env, not hardcode.
- One POST per tick. The body batches all metrics for that tick.

## Request body

```jsonc
{
  "tick": {
    "sim_t": 123.5,                          // pulse sim seconds (optional, informational)
    "wall_time": "2026-04-19T20:32:00.000Z"  // pi-sim's tick wall time (required)
  },
  "samples": [
    {
      "name": "heart_rate",                  // canonical pi-chart metric name
      "value": 78.4,                         // number; for blood_pressure, see §Compound metrics
      "unit": "beats/min",
      "sampled_at": "2026-04-19T20:32:00.000Z",  // ISO-8601, equals wall_time for live ticks
      "source": {
        "kind": "monitor_extension",         // ADR 006 canonical (Device-origin)
        "ref": "pi-sim/pulse@<scenario>"     // free-form pi-sim identity, e.g. pi-sim/pulse@StandardMale
      },
      "quality": "valid"                     // "valid" | "questionable" | "invalid"; default "valid"
    }
  ]
}
```

### Required sample fields

`name`, `value`, `unit`, `sampled_at`, `source.kind`, `source.ref`.

### Optional sample fields

- `quality` — defaults to `"valid"`.
- `context` — free-form object passed through verbatim. Example for spo2: `{"o2_device":"nasal_cannula","o2_flow_lpm":3}`.

### Server-stamped fields (do not send)

- `sample_key` — computed by pi-chart on ingest using `src/vitals.ts:formatVitalSampleKey`. Keeping the algorithm in one place prevents pi-sim and pi-chart from drifting on sha256 inputs.
- `recorded_at` — server wallclock on receipt. Distinct from `sampled_at`.
- `subject` — copied from `:patientId` URL param.
- `encounter_id` — copied from `:encounterId` URL param.
- `chart_state` — set to `"latent"` on ingest. Only Lane C/promotion can flip it.

## Canonical metric names

Use pi-chart's existing canonical set (`src/vitals.ts` `CORE_VITAL_METRICS` + `A1_CANONICAL_SHARED_METRICS`). pi-sim's translator maps Pulse field names:

| Pulse field | pi-chart `name` | `unit` |
|---|---|---|
| `hr` | `heart_rate` | `beats/min` |
| `rr` | `respiratory_rate` | `breaths/min` |
| `spo2` | `spo2` | `%` |
| `map` | `map` | `mmHg` |
| `bp_sys` | `bp_systolic` | `mmHg` |
| `bp_dia` | `bp_diastolic` | `mmHg` |
| `temp_c` | `temp_c` | `degC` |
| `etco2_mmHg` | `etco2_mmhg` | `mmHg` |
| `pao2_mmHg` | `pao2_mmhg` | `mmHg` |
| `paco2_mmHg` | `paco2_mmhg` | `mmHg` |
| `urine_ml_hr` | `urine_ml_hr` | `mL/hr` |
| `ph` | `ph` | (unitless) |
| `lactate_mmol_l` | `lactate_mmol_l` | `mmol/L` |
| `hgb_g_dl` | `hgb_g_dl` | `g/dL` |
| `cardiac_output_lpm` | (skip for v0) | — |
| `stroke_volume_ml` | (skip for v0) | — |

Unknown metric names are accepted but emit a server-side warn and may be filtered by future validator rules. Keep to the table above for v0.

### Compound metrics

Skip `blood_pressure` as a compound for v0 — send `bp_systolic` and `bp_diastolic` as separate samples, matching the existing pi-chart fixture pattern.

## source.kind

Use `monitor_extension` (ADR 006 §Device-origin: "pi-sim or equivalent live monitor ingest extension"). No new kind needed. Distinguish individual streams via `source.ref` (recommended pattern: `pi-sim/pulse@<scenario_name>`).

## Idempotency

Server computes `sample_key` per `formatVitalSampleKey` inputs (`subject | encounter_id | name | sampled_at | source.kind | source.ref | value | unit`). On collision with a row already in the encounter buffer:

- **Drop and 200 OK**, do not append a duplicate. Server response counts the dropped row in `accepted` but flags it in `dedup_count`.
- pi-sim retries on transient network errors are therefore safe.

## Response

```jsonc
{
  "accepted": 17,
  "appended": 17,
  "dedup_count": 0,
  "warnings": []
}
```

## Error responses

| HTTP | Reason | pi-sim should |
|---|---|---|
| 400 | Body fails JSON parse / required field missing | log + drop the tick |
| 404 | Unknown `patientId` or `encounterId` (not registered with pi-chart yet) | log + degrade gracefully (continue writing pi-sim's native `vitals/current.json`) |
| 409 | Encounter closed (atomic-rename to `_archive/` already happened) | stop streaming for that encounter; do not retry |
| 422 | All samples rejected (no canonical metric names matched) | log + drop |
| 500 | Server error | retry with backoff up to N times, then log + drop the tick |

## Encounter lifecycle

- **Open**: ingest accepted; appends to `_latent/<encounter_id>.jsonl`.
- **Closed**: ingest returns 409. The latent file has been atomically renamed to `_latent/_archive/<encounter_id>.jsonl`. Lane D spec acceptance criterion A6.
- **Reopen**: not supported in v0. A new encounter requires a new `:encounterId`.

## pi-sim behavior when pi-chart is offline

Per Lane D acceptance criterion A8, pi-sim must run standalone. If POST fails (connection refused, timeout, 5xx after retries):

1. Log a single warning per minute (don't spam).
2. Continue writing pi-sim's native `vitals/current.json` and `timeline.json` unchanged.
3. Do not buffer-and-replay on reconnect for v0. Missed ticks are missed; the encounter is best-effort.

## Worked example

pi-sim has been running scenario `StandardMale` for 124 sim seconds. Tick at sim_t=124, wall_time=2026-04-19T20:32:04Z. Patient `patient_002`, encounter `enc_p002_001`.

```http
POST /vitals/patient_002/enc_p002_001/ingest
Content-Type: application/json

{
  "tick": { "sim_t": 124, "wall_time": "2026-04-19T20:32:04.000Z" },
  "samples": [
    { "name": "heart_rate",       "value": 96,   "unit": "beats/min",   "sampled_at": "2026-04-19T20:32:04.000Z", "source": {"kind": "monitor_extension", "ref": "pi-sim/pulse@StandardMale"} },
    { "name": "respiratory_rate", "value": 22,   "unit": "breaths/min", "sampled_at": "2026-04-19T20:32:04.000Z", "source": {"kind": "monitor_extension", "ref": "pi-sim/pulse@StandardMale"} },
    { "name": "spo2",             "value": 92,   "unit": "%",           "sampled_at": "2026-04-19T20:32:04.000Z", "source": {"kind": "monitor_extension", "ref": "pi-sim/pulse@StandardMale"}, "context": {"o2_device":"nasal_cannula","o2_flow_lpm":3} },
    { "name": "map",              "value": 72.1, "unit": "mmHg",        "sampled_at": "2026-04-19T20:32:04.000Z", "source": {"kind": "monitor_extension", "ref": "pi-sim/pulse@StandardMale"} },
    { "name": "bp_systolic",      "value": 98.2, "unit": "mmHg",        "sampled_at": "2026-04-19T20:32:04.000Z", "source": {"kind": "monitor_extension", "ref": "pi-sim/pulse@StandardMale"} },
    { "name": "bp_diastolic",     "value": 59.0, "unit": "mmHg",        "sampled_at": "2026-04-19T20:32:04.000Z", "source": {"kind": "monitor_extension", "ref": "pi-sim/pulse@StandardMale"} }
  ]
}
```

→ pi-chart server stamps `sample_key`, `recorded_at`, `subject`, `encounter_id`, `chart_state: "latent"` on each row, appends to `pi-chart/patients/patient_002/_latent/enc_p002_001.jsonl`, and returns `{ accepted: 6, appended: 6, dedup_count: 0, warnings: [] }`.

## Versioning

This is contract v0. Breaking changes ship under v1 with the URL path bumped (`/vitals/v1/...`). Until then, additive changes only (new optional fields, new metric rows in the table).

## Open items (defer; not blockers for pi-sim agent)

- Specific port number — pi-chart picks once the ingest server is implemented.
- Whether `wall_time` should additionally carry a monotonic counter for tie-breaks within a sub-second batch.
- Whether `context.o2_device` should be promoted to a first-class field. Today it rides in `context` per the existing fixture pattern.
- Whether to support compressed bodies (gzip) for high-rate streams. Not needed at 2s cadence.
