# pi-chart vitals-connector unblock — high-level plan (26042026)

Companion to **pi-sim ADR 002** (three-stream topology, accepted 2026-04-23). pi-sim's agent is currently working that ADR. This memo names the **pi-chart-side** work needed so the pi-sim → pi-chart vitals seam stops being a mock and becomes the substrate the triad demo depends on.

High-level only by request. No schema diffs, no validator rule wording, no code.

## Recap of what already exists in pi-chart

- `vitals.jsonl` per encounter/day under `patients/<id>/timeline/<date>/`. Sample shape includes `sampled_at`, `recorded_at`, `sample_key`, `subject`, `encounter_id`, `source: {kind, ref}`, `name`, `value`, `unit`, `quality`, optional `context`.
- `src/vitals.ts` — `formatVitalSampleKey` (sha256 identity), `vitalQualityState`, canonical metric set.
- Views: `src/views/vitalsTrend.ts`, `src/views/currentState.ts` exposes latest vitals.
- `vitals://` URI evidence-ref scheme + `kind: "vitals_window"` on `EvidenceRef`.
- `scripts/agent-canvas-connector.ts` — **mock** connector to the agent canvas.
- `docs/design/pi-agent-connector-contract.md` — render-layer-only `latestVitals[].source: "charted" | "device" | "agent_inferred"` distinction.

## Recap of what is missing

| Gap | Where pi-sim ADR 002 names it |
|---|---|
| Live-engine write contract (canonical `source.kind`, append path, idempotency) | §2 (vitals stream), §Subsystems #2 |
| Explicit `<Latent>` vs `<Charted>` state on vital samples in pi-chart storage | §2, §5 ("two labels are states on one stream, not separate tables") |
| `<Latent>` → `<Charted>` promotion contract (who, what evidence, what granularity, corrections) | §5, §Open sub-decisions #2 |
| Real (non-mock) connector pulling live vitals into the agent canvas | implied by triad demo in §Immediate next work #3 |

## The four lanes (A → B → C, D parallel after B)

### Lane A — Live-vitals write contract  *(smallest, highest leverage, ship first)*

- **What:** a contract memo + a thin pi-chart write helper exported from `src/vitals.ts` that pi-sim's TS harness can call.
- **Decisions to lock** (lightweight, contract-memo-shaped, not a full ADR):
  - Canonical `source.kind` for the live pi-sim engine (today fixtures use `monitor_extension`; live engine may need its own kind under ADR 006 taxonomy).
  - Required fields and the `sampled_at` vs `recorded_at` distinction for live writes.
  - Idempotency rule on `sample_key` collision (drop / replace / error).
  - Append path: stay on per-encounter/day `jsonl` for MVP; defer any streaming endpoint.
  - `quality` default for ground-truth pi-sim samples.
- **Unblocks:** pi-sim agent immediately — they need to know what shape to write.
- **Out of scope here:** clock ownership (pi-sim ADR 002 Open #1; pi-sim-side decision).

### Lane B — Latent vs Charted state in storage  *(ADR-shaped)*

- **What:** an ADR adding an explicit state distinction on vital samples (recommend: a sample-level `chart_state` field rather than reusing event `status_detail`, since vitals are jsonl rows, not events). CLAIM-TYPES amendment + a validator rule + view filter helpers follow.
- **Open questions to lock during ADR drafting:**
  - Field placement: top-level `chart_state` on the sample vs. routing through ADR 002 (pi-chart) `status_detail` (samples are not events — likely no).
  - Default for existing fixtures: latent (rebake) or charted (grandfather).
  - Does `charted` require an attestation pointer (ADR 017)?
- **Touches:** `src/vitals.ts`, `src/views/vitalsTrend.ts` + `currentState.ts` (filter), `src/validate.ts`, CLAIM-TYPES.md.
- **Depends on:** A (so the field that pi-sim writes is known and matches).

### Lane C — Latent → Charted promotion API  *(ADR-shaped, defer code)*

- **What:** an ADR resolving the open sub-decision pi-sim ADR 002 §5 deferred. Implementation can wait; ADR alone is enough to unblock the demo.
- **Open questions:** who can promote; evidence required; granularity (per-sample / per-minute / per-shift — recommend per-minute aggregate); corrections semantics (entered_in_error vs addendum).
- **Cross-cuts:** ADR 017 actor/attestation/review taxonomy. Confirm whether a promotion is itself an attestation event or a new event subtype.
- **Depends on:** B (need the state field to flip).
- **Defer implementation** until A + B + D are running.

### Lane D — Real connector replaces mock  *(small, visible, product proof)*

- **What:** rewire `scripts/agent-canvas-connector.ts` to call `currentState()` + `vitalsTrend()` against real `patient_002` data; derive `latestVitals[].source` from B's `chart_state` instead of inventing it at the render layer.
- **Depends on:** B (so the source mapping is grounded, not guessed).
- **Smallest implementation lane once B lands.** Ship before C per the proof-before-polish rule — gives the triad demo something to render even before promotion is implemented.

## Sequence

```
A (contract memo + write helper)          ← ships first; unblocks pi-sim agent
   │
   ├─► B (ADR + chart_state field)         ← ships second; pi-chart-internal
   │      │
   │      ├─► D (real connector cutover)   ← ships third; visible demo
   │      │
   │      └─► C (promotion ADR)            ← ADR can draft in parallel; code lands last
```

## Coordination with the pi-sim agent

- Lane A's `source.kind` must be a value pi-sim agreed to write. Confirm before publishing.
- Clock ownership (pi-sim ADR 002 Open #1) is **not** in this plan — pi-sim-side decision. Named here so neither side assumes the other owns it.
- Physical-assessment transport (pi-sim ADR 002 Open #3) is **not** in this plan — separate seam.

## Out of scope (explicitly named)

- pi-sim engine internals and Pulse driver.
- pi-agent skills library beyond the connector handoff.
- Multi-patient scaling (pi-sim ADR 002 Open #5).
- Monitor-UI alarm channel routing (pi-sim ADR 002 §3) — that is pi-sim's first-class subsystem, not a pi-chart contract.
- Intervention write-back (pi-sim ADR 002 "missing arrow").
- Streaming write endpoint (Lane A stays on `jsonl` append for MVP).

## Acceptance signal for this planning lane

- This memo lands in `pi-chart/memos/` with DDMMYYYY suffix.
- Each of A / B / C / D has a named output artifact and a clear precondition.
- pi-sim agent can read §Lane A and know within a day what shape to write.
- `kanban-prd-board.md` gets four lane rows added (A/B/C/D) with statuses **planned** for B/C/D and **next** for A.

## Cross-references

- `pi-sim/docs/adr/002-pi-sim-as-patient-three-stream-topology.md` (the upstream ADR pi-sim is implementing).
- `pi-chart/decisions/002-status-lifecycle.md` (envelope `status` vs `data.status_detail`; vitals are not events but the model is the precedent for the Latent/Charted naming question).
- `pi-chart/decisions/006-source-kind-taxonomy.md` (Lane A canonical `source.kind` lives in this taxonomy).
- `pi-chart/decisions/017-actor-attestation-review-taxonomy.md` (Lane C cross-cut).
- `pi-chart/docs/design/pi-agent-connector-contract.md` (Lane D cutover target).
- `pi-chart/src/vitals.ts`, `pi-chart/src/views/vitalsTrend.ts`, `pi-chart/src/views/currentState.ts`.
