> **TOMBSTONE — historical seam context only.**
> This pre-M-series planning lineage is superseded for current `pi-sim` runtime work by `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md` plus `.omx/plans/plan-pi-sim-m1-runtime-skeleton-scripted-provider.md`, `.omx/plans/plan-pi-sim-m2-pulse-provider-runtime.md`, `.omx/plans/plan-pi-sim-m3-public-event-waveform-lanes.md`, `.omx/plans/plan-pi-sim-m4-encounter-assessment-public-schema.md`, and `.omx/plans/plan-pi-sim-m4-abi-hardening-remediation.md`.
> Retain this file for design lineage only; do not treat it as an executable PRD unless a newer plan explicitly revives a slice.

---

# 004a — Architecture Review of PRD 004 (codex + gemini synthesis)

Status: review memo (informs next PRD pass; does NOT edit PRD 004)
Date: 2026-04-26
Method: tri-model orchestration via `oh-my-claudecode:ccg`. Codex got architecture/correctness/scaling lens (Q1, Q2, Q4). Gemini got system-fit/clinical-safety/alternatives lens (Q3, Q5, Bonus).
Artifacts:
- `pi-sim/.omc/artifacts/ask/codex-...2026-04-27T00-53-27.md`
- `pi-sim/.omc/artifacts/ask/gemini-...2026-04-27T00-53-15.md`

The memo is structured as the user requested: convergent / divergent / promote / defer / forward-compat. Each row cites both the advisor finding and the PRD section it touches.

---

## 1. Convergent recommendations (both advisors agree)

| # | Finding | Codex framing | Gemini framing | PRD section |
|---|---|---|---|---|
| C1 | The aggregator's "last-in-window" default is **not** safely deferrable to D11 alone — intra-minute extremes are clinically load-bearing and PRD 005 needs them. | "Keep last-in-window as MVP" but adds caveat that policy resolution must promote when alarm channel surfaces extremes (Q2 partial; D11 listed as "promote NEW"). | "Clinically dangerous"; ship `{min, max, last}` triple now; upgrade Risk #2 to Critical. | §5 S5; §8 Risk 2; §3a D11 |
| C2 | S9's file-watcher is the topology's fragility surface. The pure pipeline (S2/S3/S5/S6/S7) survives transport changes; the watcher does not. | "Split `watch.ts` into `SourceReader` adapters: file-current, replay, future HTTP/stream." | "Pass-Through Aggregator" / "In-Process Observer" — file-watcher latency is the issue. | §5 S9; §3 topology row |
| C3 | Schema/contract validation needs strengthening at the ingest → chart boundary, not just at write time. | Promote D9 (schema-version drift) to a runtime assertion at ingest startup. | Add JSON-schema validation in S5 before the chart write-path is hit. | §5 S5 + S6; §3a D9 |
| C4 | Encounter-existence and context-manifest preconditions are too loose. | Promote D12 (encounter guard at S9/S7); promote D10 (context default is a fixtures-dir category violation). | Implicit in "shared logic library" — both ends must agree on what's there. | §5 S9 flags; §3a D10, D12 |

## 2. Divergent recommendations (advisors disagree)

| # | Codex direction | Gemini direction | Synthesis call |
|---|---|---|---|
| V1 | **Topology**: incremental — keep file-watcher MVP, split S9 into a `SourceReader` adapter interface so HTTP/streaming/SQLite become plug-ins later. | **Topology**: radical alternatives — "UI-Driven EMR Push" (in-process observer in Monitor UI) or "Relational Substrate Transport" (SQLite WAL replacing JSONL). | **Codex**. Gemini's alternatives violate ADR 002 §3 (Monitor UI is one consumer of pi-sim, not a write-side participant) and pi-chart's filesystem-native thesis ("the chart is canonical"). Codex's adapter split is incremental and forward-compatible. Adopt the SourceReader interface; name Gemini's alternatives as road-not-taken. |
| V2 | **Aggregation**: keep last-in-window MVP; defer the clinical policy via D11 with documentation of the bias. | **Aggregation**: ship `{min, max, last}` triple now; classify last-in-window as a clinical-safety bug. | **Hybrid**. Schema-additive solution: row's primary `value` stays `last` (preserves pi-chart canonical metric semantics), but S2 captures `{min, max}` into `context.window` so PRD 005's alarm channel can read intra-minute extremes from the same row. No pi-chart schema change; clinical signal preserved; D11 still names the future "real" decision. |
| V3 | **Idempotency**: keep authority at the chart boundary (`appendVital`). Ingest may cache seen keys as advisory only. | **Schema enforcement**: validate at ingest before the write hits the chart. | Both. They are not the same thing. Codex's call: chart is the source of write truth. Gemini's call: ingest validates shape before the wire. Adopt both — they layer. |

## 3. Decisions to PROMOTE into PRD 004 scope (next PRD pass)

These are deferred decisions in current §3a that the review surfaced as MVP-blocking. Each becomes a small PRD 004 §3 row + a §5 slice obligation.

| § | Decision | Promoted form | New slice / §3 row |
|---|---|---|---|
| D1 (partial) | Canonical clock ownership | "For this PRD, `chart.sim_start` from `chart.yaml` is authoritative; pi-sim is a relative-time emitter; cross-project clock ownership stays deferred." | Add §3 row "Clock authority"; S3 already implements |
| D5 (partial) | File-locking | Single-writer guard at S7 entry: `appendVital` acquires a sidecar PID lockfile (`vitals.jsonl.lock`) for the day file or aborts with a clear error. | New S7 sub-step + verify |
| D7 (minimum) | Watcher gap policy | `--gap-policy halt` (already drafted) becomes the **enforced** default with an explicit gap-detection assertion in S10b. Polling fallback stays deferred. | S10b verify expansion |
| D9 | Schema-version drift | Ingest startup asserts `pi-chart` package's `schema_version` matches an `expectedChartSchema` constant in `pi-rn/ingest/src/schemaCheck.ts`. Mismatch exits non-zero with a clear message. | New S0b slice |
| D10 (partial) | Context manifest ownership | `--context` becomes **required** (no default) so `fixtures/` is no longer a runtime config path. Long-term home stays deferred. | §5 S4 + S9 flag table edit |
| D12 | Encounter-existence guard | `appendVital` (S7) refuses to write into a non-existent `patients/<id>/timeline/<YYYY-MM-DD>/` parent or a `patients/<id>/chart.yaml` whose `subject` doesn't match. | S7 sub-step + verify |
| C1+V2 (NEW) | Intra-minute extremes capture | S2 translator records per-window `{min, max, last}` into `context.window` of the per-minute row; primary `value` stays `last`. PRD 005 reads `context.window.min` for breach detection. | S2 + S5 + §3 cadence row |
| C2+V1 (NEW) | SourceReader adapter interface | S9 splits into `SourceReader` interface with `FileCurrentReader`, `ReplayFromReader` implementations + named-but-deferred `HttpStreamReader`. Pipeline (S2/S3/S5/S6) consumes the interface, not a file. | S9 refactor |

## 4. Decisions to LEAVE deferred (synthesis confirms)

| # | Decision | Why still deferred |
|---|---|---|
| D2 | Latent → Charted promotion contract | Out of MVP per ADR 002 §5. Still a future ADR. |
| D3 | Multi-patient concurrent ingest | One demo, one encounter. Adapter split (C2+V1) makes the future transition easier without committing to it now. |
| D4 (mostly) | sample_key collision-with-different-value | Already errors loudly per S7. Full reconciliation (overwrite vs supersession vs revisor) is deferred. |
| D6 (mostly) | Day-rollover beyond tested transition | S7 day-file resolver covers the basic transition; multi-day continuous-watch resilience deferred. |
| D8 | Mid-batch failure semantics | Per-row atomicity is enough for MVP. Batch-API is a future optimization. |
| D11 (mostly) | Aggregation policy beyond `{min, max, last}` | The triplet capture (C1+V2) handles the immediate clinical concern. Mean/median/max-deviation per-metric remains a future clinical decision. |

## 5. Forward-compat constraints PRD 004 must add

These are PRD-level invariants the next pass must encode so future work doesn't paint into a corner.

1. **(Gemini "Mirror Check")** S8's scripted-replay backend MUST extract its physiology-source generator into a shared module (`pi-sim/scripts/lib/replaySource.ts`) that the future Monitor UI exercise (PRD 003 refresh) consumes verbatim. Prevents "zombie UI" drift where replay and UI render different truth from the same source.
2. **SourceReader interface narrowness.** The interface must expose only `read(): AsyncIterable<PulseTick>` — no file/HTTP/SQLite specifics leak into the pipeline. Codex's incremental adapter split survives only if the interface stays narrow.
3. **`context.window` is additive to `value`, never a replacement.** Future aggregation-policy ADRs may change what `value` means; `context.window` stays a faithful record of the source-tick distribution within the aggregation window.
4. **Ingest is the only legal cross-project importer.** pi-chart never imports pi-sim; pi-sim never imports pi-chart; ingest depends on pi-chart (legal) and on no pi-sim source code (file-watching `vitals/current.json` is a runtime dependency only, enforced by `grep` in PRD 004 acceptance #7).
5. **Chart-as-write-truth boundary.** `appendVital` is the sole authority on whether a sample is durably persisted. Ingest MAY cache seen `sample_key`s as a perf optimization but must never use that cache to skip a chart call.

## 6. Named alternatives (road not taken)

Gemini surfaced two architectures that the PRD should NAME but reject for MVP. Each gets a one-paragraph "why we did not pick this" in the PRD.

- **UI-Driven EMR Push** (in-process observer inside the Monitor UI). Eliminates file-watcher latency; couples the chart write-path to the UI process. Rejected because ADR 002 §3 frames Monitor UI as one consumer among several (alarms, agent attention) — making it the EMR-push owner inverts the topology.
- **Relational Substrate Transport** (SQLite WAL replacing `vitals/current.json` watching). Better ACID semantics; queryable for PRD 006. Rejected because pi-chart's thesis is "the chart is canonical, current state is a query"; introducing a relational substrate at the transport layer undermines the filesystem-native primitive.

## 7. Recommended PRD 004 patch checklist (for next pass)

In priority order, mapped to convergent/divergent decisions above:

1. Implement C1+V2 (`context.window` triplet capture) — clinical-safety win at low schema cost.
2. Implement C2+V1 (SourceReader adapter split in S9) — protects future HTTP/streaming transitions.
3. Promote D5 (single-writer lockfile in S7) and D12 (encounter guard in S7) — defends against silent-write-into-wrong-encounter.
4. Promote D9 (schema-version assertion as new S0b) — defends against pi-chart schema bumps.
5. Promote D10 partial (`--context` required, no fixtures-dir default) — resolves the category violation cleanly.
6. Add forward-compat constraint §5.1 (S8 shares physiology-source module with future Monitor UI) — prevents zombie-UI drift.
7. Document the two named alternatives in §3 as "alternatives considered."

Estimated edit size: ~80 lines added to PRD 004 (one new §3 row, two new slices, two §5 list edits). No structural rewrite.

## 8. Cross-references

- PRD 004 — `/home/ark/pi-rn/pi-sim/docs/plans/004-vitals-telemetry-bridge.md`
- ADR 002 — `/home/ark/pi-rn/pi-sim/docs/adr/002-pi-sim-as-patient-three-stream-topology.md`
- Codex artifact — `/home/ark/pi-rn/pi-sim/.omc/artifacts/ask/codex-you-are-an-architecture-advisor-...-2026-04-27T00-53-27-448Z.md`
- Gemini artifact — `/home/ark/pi-rn/pi-sim/.omc/artifacts/ask/gemini-you-are-an-alternatives-system-fit-advisor-...-2026-04-27T00-53-15-188Z.md`
