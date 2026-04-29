> **TOMBSTONE — historical seam context only.**
> This pre-M-series planning lineage is superseded for current `pi-sim` runtime work by `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md` plus `.omx/plans/plan-pi-sim-m1-runtime-skeleton-scripted-provider.md`, `.omx/plans/plan-pi-sim-m2-pulse-provider-runtime.md`, `.omx/plans/plan-pi-sim-m3-public-event-waveform-lanes.md`, `.omx/plans/plan-pi-sim-m4-encounter-assessment-public-schema.md`, and `.omx/plans/plan-pi-sim-m4-abi-hardening-remediation.md`.
> Retain this file for design lineage only; do not treat it as an executable PRD unless a newer plan explicitly revives a slice.

---

# 005 — Alarm Channel (monitor → pi-agent, scaffold)

Status: scaffold PRD (not yet deepened)
Date: 2026-04-26
Owner ADR: `pi-sim/docs/adr/002-pi-sim-as-patient-three-stream-topology.md` §3
Sibling deep PRD: `004-vitals-telemetry-bridge.md`
Sibling scaffold: `006-assessment-query.md`

---

## 1. Goal (one sentence)

Build the **direct alarm channel from the bedside Monitor UI to pi-agent, bypassing pi-chart**, that ADR 002 §3 names load-bearing for the agent's reactive sensory path.

## 2. Scope sketch

- pi-sim already emits `alarms: ["MAP_LOW", "LACTATE_HIGH", ...]` on every `current.json` tick (per `pi-sim/vitals/README.md`).
- The Monitor UI owns alarm GENERATION (threshold breaches, rhythm anomalies). Today the alarms in `current.json` are pi-sim-side breach flags, not Monitor-UI-generated. Need to decide: (a) Monitor UI re-generates alarms from raw vitals using its own thresholds, (b) Monitor UI passes through pi-sim's flags, or (c) hybrid.
- Transport from Monitor UI → pi-agent: not yet designed. ADR 002 says "direct ... bypassing pi-chart" — implies sidecar channel (file, IPC, WebSocket, SSE).
- Alarms must reach pi-agent as **events with provenance** (which patient, which encounter, which alarm code, which threshold breached, which sample triggered). pi-agent's reaction is itself subject to discernment per ADR 002 §3.

## 3. Open questions (must resolve before deepening)

1. **Alarm generation home.** Monitor UI vs pi-sim vs both. ADR 002 §3 says Monitor UI; pi-sim already emits its own. Reconcile.
2. **Transport.** File-watcher (alarms.jsonl sidecar)? Long-poll? SSE? WebSocket? Affects pi-agent runtime architecture.
3. **Alarm taxonomy.** Threshold-breach codes (`MAP_LOW`) vs rhythm anomalies vs technical alarms (lead-off, low battery). pi-sim today emits only threshold codes.
4. **Filtering / fatigue policy.** ADR 002 sub-decision #4 named this open. First-pass: raw passthrough, log token cost, decide later. Or: pre-filter on Monitor UI side now to set the scaling pattern.
5. **Replay semantics.** When the Vitals Telemetry replay (PRD 004) runs the patient_002 fixture, do alarms also replay? The fixture has no alarm rows today. Need to author or derive.
6. **Acknowledgement.** Does pi-agent ACK alarms? Does the Monitor UI track alarm-state (active / acked / cleared)? Affects UI surface area.
7. **Cross-PRD coupling.** Alarm events likely also need a charted record (Joint Commission considerations downstream). That conflicts with "bypasses pi-chart" — needs design.

## 4. Slices (placeholder)

To be filled out after the deepening interview. Anticipated shape:

- `S0` — Alarm event schema + transport ADR (memo before code).
- `S1` — Monitor UI alarm generator (threshold table, hysteresis policy).
- `S2` — Sidecar transport implementation (depends on §3.2).
- `S3` — pi-agent receiver + dispatch into the agent skill loop.
- `S4` — Replay/fixture support so PRD 004's demo can include scripted alarms.
- `S5` — Filtering policy memo (ADR 002 sub-decision #4).

## 4a. Coordination with PRD 004

PRD 004's translator (S2) explicitly drops `current.json`'s `alarms[]` field. When this PRD deepens, it must pick exactly one path:
- **(A)** extend PRD 004's translator to ALSO emit alarm events into a new sidecar (`alarms.jsonl` per encounter), OR
- **(B)** re-read `current.json` on its own sidecar watcher (independent of PRD 004's ingest), OR
- **(C)** generate alarms inside the Monitor UI from raw vitals (independent of `current.json`'s pi-sim-side `alarms` field).

Path C is the ADR 002 §3 framing; path A is the lowest-effort coupling; path B is the cleanest decoupling. Decide before §4 S0 lands.

Forward-compat constraint inherited from PRD 004 §8 risk 9: PRD 005 may extend the translator but may not modify its existing vitals semantics.

## 5. Demo target

`patient_002 / enc_p002_001` — the same Agent Canvas respiratory watcher fixture used by PRD 004. Adds a scripted alarm (e.g. `SPO2_LOW` triggered when SpO2 crosses 90 at 09:15) so the agent surface receives a reactive trigger during the demo window.

## 6. Out of scope at scaffold stage

- Implementation of any of the slices (this is a scope sketch only).
- Alarm UX inside the Agent Canvas (separate UI PRD when transport is decided).
- Multi-patient alarm aggregation (depends on multi-patient ingest from PRD 004's deferred work).

## 7. When to deepen

Deepen this PRD after:
- PRD 004 lands acceptance #6 (live mode proof) — confirms the Monitor UI / replay loop is observable and instrumentable.
- One pi-agent skill that needs reactive triggers exists (gives a concrete consumer for the alarm event shape).
- Operator decides on filtering posture (raw vs pre-filter) per §3.4.

## 8. Cross-references

- ADR 002 §3 (Monitor UI is architecturally first-class) — the source of this PRD's mandate.
- ADR 002 sub-decision #4 (alarm filtering / fatigue policy) — explicitly deferred; must close before §4 S5.
- pi-sim `vitals/README.md` — current.json `alarms` array shape.
- pi-sim `vitals/alarms.json` — per-field threshold bands; candidate input for the Monitor UI generator.
- PRD 003 (`pi-sim/docs/plans/003-monitor-ui.md`) — needs revision per ADR 002 §Consequences before this PRD opens.
