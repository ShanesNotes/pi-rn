# pi-sim → pi-chart monitor ingest — interface spec

**Status**: spec only. No ingest code exists yet. This document captures the contract for whatever component eventually translates `pi-sim`'s public monitor surface into `pi-chart` vitals rows.

**Why deferred**: pi-chart just promoted; ingest contracts are downstream of chart contracts. Writing ingest code now would freeze sampling cadence, idempotency strategy, and failure-mode behavior before pi-chart has been observed under load. This spec preserves the design intent while pi-sim and pi-chart are both in context.

---

## Hard boundary

Ingest reads **only** from `pi-sim`'s public monitor outputs:

- `pi-sim/vitals/current.json` — latest snapshot (single sample per metric).
- (future) a bounded `pi-sim/vitals/history.json` if backfill becomes necessary.

Ingest **never** reads:

- `pi-sim/vitals/timeline.json` — that is sim-internal projection; reading it would leak future state assumptions and tie pi-chart's ingest to the simulator's sampling model.
- `pi-sim/scenarios/**` — internal physiology config.
- `pi-sim/scripts/engine/**` — internal model code.
- any other path under `pi-sim/` not explicitly named here.

This boundary is the entire point of the ingest layer. Violating it means the agent's chart no longer represents "what was observed at the bedside" but rather "what the simulator's internal model produced," which destroys the simulation's epistemic asymmetry.

---

## Ingest source shape

Expected `pi-sim/vitals/current.json` shape (verify against pi-sim before implementing):

```jsonc
{
  "sampled_at": "2026-04-18T08:40:00-05:00",
  "encounter_id": "enc_001",          // present if pi-sim is running with an encounter id
  "metrics": {
    "heart_rate":       { "value": 108, "unit": "beats/min" },
    "bp_systolic":      { "value": 130, "unit": "mmHg" },
    "bp_diastolic":     { "value": 76,  "unit": "mmHg" },
    "respiratory_rate": { "value": 24,  "unit": "breaths/min" },
    "spo2":             { "value": 89,  "unit": "%",
                          "context": { "o2_device": "nasal_cannula", "o2_flow_lpm": 2 } }
  }
}
```

Open question: pi-sim's actual current shape may differ. The first ingest implementation step is to **read pi-sim/vitals/README.md** and confirm field names; the spec's ingest mapping table is the contract — adjust pi-sim's output OR the mapping, not both.

## Mapping to pi-chart

Each metric in `current.json` produces one row appended to `pi-chart/timeline/<YYYY-MM-DD>/vitals.jsonl` (where `YYYY-MM-DD` derives from `sampled_at`).

Row shape (matches `pi-chart/schemas/vitals.schema.json`):

```jsonc
{
  "sampled_at":   "<from current.json>",
  "subject":      "<chart.yaml.subject>",
  "encounter_id": "<from current.json OR chart's active encounter>",
  "source":       { "kind": "monitor_extension", "ref": "pi-sim-monitor" },
  "name":         "<metric key>",
  "value":        "<metric.value>",
  "unit":         "<metric.unit>",
  "context":      "<metric.context if present>",
  "quality":      "valid"
}
```

Notes:

- `subject` is read from `pi-chart/chart.yaml` at startup; ingest is single-patient per process.
- If `current.json.encounter_id` is missing, ingest looks up the active encounter from the latest `timeline/*/encounter_*.md` whose status is `active`. If none, ingest refuses to write (fail closed).
- `quality` defaults to `valid`; if pi-sim ever exposes a quality flag, ingest carries it through.

## Trigger model

Two viable strategies:

| Strategy | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Polling** (e.g. 5s) | Simple. No fs-events headaches across platforms. Bounded write rate independent of sim tick rate. | A few seconds of latency. May write near-duplicate rows if sim hasn't ticked. | **Default for v0.** |
| **fs-watch** (`chokidar` or `node:fs.watch`) | Sub-second latency. Proportional to sim tick rate. | Platform quirks. Burst-y when many metrics change at once. | Optional; reach for it when latency matters. |

Recommended polling cadence: 5 s. Configurable via env var (`PI_INGEST_POLL_MS`).

## Idempotency

The natural key is `(subject, encounter_id, name, sampled_at)`. Ingest must not append a row whose `(name, sampled_at)` was already written for the active encounter.

Two implementation options:

- **State-file**: persist last-seen `sampled_at` per metric to a small `pi-chart-ingest-state.json` outside the chart (or under `pi-sim/.ingest-state/`, but **not** inside `pi-chart/` since that's an agent-visible surface).
- **Tail-scan**: on each tick, read the tail of today's `vitals.jsonl` and compare. Cheap on small files; degrades on large ones.

Default: state-file. Falls back to tail-scan if state is missing (handles fresh starts).

## Failure modes

| Failure | Behavior |
|---------|----------|
| `current.json` missing | Skip tick. Log once per minute. Do not crash. |
| `current.json` malformed JSON | Skip tick. Log full error first time, then once per minute. |
| `current.json.sampled_at` invalid ISO | Skip tick + log. |
| `current.json` has new metric ingest doesn't recognize | Pass-through with whatever unit pi-sim reports. Log a one-shot warning. |
| Active encounter cannot be resolved | Fail closed — do not write. Log loudly. |
| `pi-chart/timeline/.../vitals.jsonl` write fails (ENOSPC, EACCES) | Crash with non-zero exit; let supervisor restart. Better to be loud than silently lose vitals. |
| Schema-rejected vitals row | Crash with non-zero exit; this means the contract drifted between sim and chart, which is a dev-time issue, not a runtime issue. |

## Validation expectations

- Ingest does **not** call `validateChart` on every tick — too expensive. Optional periodic validate (e.g. once per minute, last-event window) that logs a warning if errors appear; off by default.
- Ingest **does** validate each row it produces against `vitals.schema.json` before appending. This catches mapping bugs at the ingest boundary, not at the next chart-wide validate.

## Deployment shape

Two options. Recommendation: **standalone Node script** for v0.

### Option A — Standalone script (recommended)

Lives at `pi-sim-ingest/index.ts` (sibling to `pi-sim/`), or `scripts/sim-ingest.ts` in either repo. Run as `tsx pi-sim-ingest/index.ts`.

- Pros: clean process boundary; ingest can run/restart independently of agent; no pi-coding-agent extension API churn.
- Cons: one more thing to start in the two-terminal workflow.

### Option B — pi-agent extension

Lives at `pi-agent/.pi/extensions/monitor-ingest/index.ts`. Polls in the extension's lifecycle hook.

- Pros: one process to start; ingest pauses naturally when agent stops.
- Cons: couples agent runtime to ingest reliability; widens what the agent's container needs to access; revisit-able once agent is containerized.

**Both options use the same core mapping logic.** The recommended split: factor mapping + idempotency + appendCall into a `pi-sim-ingest/lib.ts`, with two thin entry points — `bin.ts` (standalone) and `extension.ts` (Pi). For v0, only build `bin.ts`.

## Configuration

Single config object, sourced from env vars at startup:

| Env var | Default | Purpose |
|---------|---------|---------|
| `PI_CHART_ROOT` | `../pi-chart` (relative to cwd) | Where to write vitals rows. |
| `PI_SIM_VITALS_DIR` | `../pi-sim/vitals` | Where to read `current.json`. |
| `PI_INGEST_POLL_MS` | `5000` | Polling interval. |
| `PI_INGEST_STATE_PATH` | `<XDG_STATE_HOME>/pi-rn/ingest.json` | Persistent state file. |
| `PI_INGEST_FAIL_OPEN` | `false` | If true, skip writes on encounter-resolution failure rather than crash. |

## Out of scope (v0)

- Backfill from a sim history surface — wait until pi-sim exposes one.
- Multi-patient routing — single subject per ingest process.
- Reading anything from pi-sim besides `vitals/current.json`.
- Patient-statement ingest (those come from the agent itself via `chart_append_event`, not from pi-sim).
- Lab-result ingest (those would have a separate adapter).
- Backpressure / rate-limit on chart writes.

## Open questions to resolve before implementing

1. **pi-sim/vitals/current.json actual shape**: confirm against `pi-sim/vitals/README.md`; adjust mapping table here before writing code.
2. **Encounter id source**: does pi-sim emit it, or does ingest resolve it from chart? (Default: prefer sim, fall back to chart's active encounter.)
3. **State file location**: XDG path vs co-located near pi-sim vs co-located near pi-chart. Strong argument against putting it inside `pi-chart/` (agent would see it).
4. **Should ingest be the producer of `chart.yaml.encounter_id`?** Probably not — encounter creation is an admission event, not an ingest concern.
5. **What about lossy compression of identical-value runs?** Ten consecutive identical SpO2 readings clog the chart. Decision: keep all readings in v0; the chart is supposed to be the bedside record. If volume becomes a problem, add a separate `vitals_compressor.ts` that rewrites tail with deduplication — but `_derived/`-style, not in canonical files.

---

## When to revisit this spec

After the first end-to-end run with a real two-terminal workflow (pi-sim in one terminal, ingest in another, pi-agent reading the chart in a third). Latency, duplicate rates, and the encounter-resolution edge cases will tell us whether the polling cadence, idempotency strategy, and fail-closed behavior were right.
