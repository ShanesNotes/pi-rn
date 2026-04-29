> **TOMBSTONE — historical seam context only.**
> This pre-M-series planning lineage is superseded for current `pi-sim` runtime work by `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md` plus `.omx/plans/plan-pi-sim-m1-runtime-skeleton-scripted-provider.md`, `.omx/plans/plan-pi-sim-m2-pulse-provider-runtime.md`, `.omx/plans/plan-pi-sim-m3-public-event-waveform-lanes.md`, `.omx/plans/plan-pi-sim-m4-encounter-assessment-public-schema.md`, and `.omx/plans/plan-pi-sim-m4-abi-hardening-remediation.md`.
> Retain this file for design lineage only; do not treat it as an executable PRD unless a newer plan explicitly revives a slice.

---

# 004 — Vitals Telemetry Bridge (pi-sim → pi-chart)

Status: deep PRD (slice-ready)
Date: 2026-04-26
Owner ADR: `pi-sim/docs/adr/002-pi-sim-as-patient-three-stream-topology.md`
Sibling scaffolds: `005-alarm-channel.md`, `006-assessment-query.md`
Demo target: `patient_002 / enc_p002_001` (Agent Canvas respiratory watcher)
Regression target: `patient_001 / enc_001` (proves modularity, not product focus)

---

## 1. Goal

Stand up the **vitals telemetry seam** named in ADR 002 §2 (Vitals stream) and ROADMAP Seams #1 (translator) + #2 (encounter binding). pi-sim emits Pulse-physiology ticks at monitor refresh rate; a third-process **ingest extension** translates, aggregates, and writes per-sample rows into pi-chart's `vitals.jsonl` under a caller-specified `(patientId, encounterId)`. The result is the first live `<Latent>` telemetry path for the triad demo.

One sentence: **make pi-chart's `vitals.jsonl` writable from a running pi-sim instance, with a patient-agnostic ingest binary that the Agent Canvas demo can invoke against `patient_002 / enc_p002_001` and that regression-tests against `patient_001 / enc_001`.**

## 2. Non-goals

- **No alarms.** Monitor → pi-agent alarm routing is `005-alarm-channel.md` scaffold. The translator (S2) explicitly drops `current.json`'s `alarms[]` field; PRD 005 must own re-reading or extending the translator when it deepens.
- **No assessment queries.** Latent physical findings are `006-assessment-query.md` scaffold.
- **No Monitor UI exercise.** The scripted-replay backend (S8) emits `vitals/current.json` directly, bypassing the Monitor UI subsystem. ADR 002 §3 names Monitor UI architecturally first-class for alarm generation; this PRD does not validate that claim. PRD 005 reopens it.
- **No Latent → Charted promotion API.** ADR 002 sub-decision #2 stays deferred. This PRD lands samples in `<Latent>`; promotion is a future ADR.
- **No agent write-back to pi-sim.** ADR 002 §The missing arrow stays frozen.
- **No multi-patient concurrency.** ADR 002 sub-decision #5 stays deferred. Single ingest process per encounter. Concurrent ingest against the same `vitals.jsonl` is undefined behavior.
- **No production Pulse trajectory authoring for patient_002.** Pulse stays dormant for MVP per ADR 002 §6. patient_002's hand-authored fixture is the demo physiology source; pi-sim drives a **scripted-replay backend** that emits the fixture trajectory at monitor refresh rate.

## 3. Architectural choices (resolved in interview)

| Decision | Resolution | Rationale |
|---|---|---|
| Ingest topology | Standalone third-process extension | Matches `pi-chart/README.md` "monitor extension" framing and `pi-rn/AGENTS.md` ("Do not couple pi-agent/ directly to pi-sim/ source code"). pi-sim untouched on the existing Pulse path; pi-chart adds one write entrypoint. |
| Field-name translation | Owned by ingest extension | Keeps pi-sim's Pulse-native shape stable and pi-chart's canonical metric names stable. Translator is the only place that knows both. |
| Cadence | Monitor side hi-fi (≥1 Hz tick); chart side per-minute aggregation | Bifurcated per ADR 002 §2. Monitor UI keeps ≥1 Hz; chart receives one row per metric per minute (last-value-in-window policy unless a slice elects mean). |
| Connector signature | `runIngest({chartRoot, patientId, encounterId, source, ...})` | Patient-agnostic. patient_002 / enc_p002_001 is the test invocation; a future runtime invocation passes `openedPatientId` / `openedEncounterId`. |
| Physiology source | Scripted-replay backend in pi-sim | Pulse is dormant for MVP demos (ADR 002 §6). patient_002's existing 9-sample fixture is the canonical waypoint set; the new backend interpolates between waypoints at monitor refresh rate. |
| Encounter context (`o2_device`, `o2_flow_lpm`) | Loaded from an `EncounterContextManifest` per encounter | These fields exist on `vitals.jsonl` rows but NOT in pi-sim `current.json`. Manifest is encounter-scoped; ingest merges per sample. |
| Source attribution | `source.kind: "monitor_extension"`, `source.ref` from CLI flag (default `pi-sim-monitor`, fixture uses `stepdown-monitor`) | Already validated by `pi-chart/src/validate.ts` (`monitor_extension` in v0.2 source-kind registry). |
| Clock translation | `simSampleTime = chart.sim_start + (pulseTick.t - scenarioStartT)` | Avoids depending on `wallTime`. `t` (sim seconds since scenario start) is authoritative; chart's `sim_start` from `chart.yaml` anchors. DST-correctness is the responsibility of the timezone formatter (S3 covers it explicitly). `wallTime` is read only for ordering-of-arrival diagnostics, never as the sample timestamp. |

## 3a. Deferred but named (inheritances + new gaps)

These decisions are NOT resolved by this PRD. They are named here so reviewers know the holes are intentional, not oversights, and so future PRDs / ADRs can pick them up without re-discovering them.

| # | Decision | Why deferred | When it must close |
|---|---|---|---|
| D1 | Canonical clock ownership (ADR 002 sub-decision #1) | Single-encounter MVP; only one clock in play | Before multi-patient ingest or before pi-agent reasons about "now" across pi-sim/pi-chart |
| D2 | `<Latent>` → `<Chart>` promotion contract (ADR 002 sub-decision #2) | Demo only requires Latent landing | Before any agent skill writes a corrections / supersession against an ingested vital |
| D3 | Multi-patient concurrent ingest (ADR 002 sub-decision #5) | One demo, one encounter | Second encounter introduced |
| D4 | Sample-key collision **with different value** policy | Re-runs over an edited fixture will hit this | First fixture-edit-then-rerun event; until then, ingest errors with "key collision, value mismatch" |
| D5 | `vitals.jsonl` concurrent-write strategy | Single-writer-per-encounter MVP avoids the question | Multi-writer (multiple ingest processes, ingest + manual edit, ingest + validator-rebuild) ever introduced. File-locking, atomic-rename-and-rotate, or SQLite are the candidate paths. |
| D6 | Day-rollover behavior in `--watch` | Demo windows are < 1 sim-day | First > 24-h scripted scenario |
| D7 | Watcher gap / missed-tick / backpressure policy in `--watch` | Demo runs in a stable shell; backpressure unobservable | First production-like run with a slow chart write or a paused ingest |
| D8 | `appendVital` mid-batch failure semantics | Demo writes one row at a time | Future batch-append API (per-minute aggregator could call appendVital in batches) |
| D9 | Schema-version drift between pi-chart and ingest | Both are pinned in this PRD | First pi-chart schema bump after PRD ships |
| D10 | Encounter-context manifest ownership and authoring | Manifests live in `pi-rn/ingest/fixtures/` for MVP, which is a category violation (production code reads from a fixtures dir) | First non-fixture encounter; manifests likely move into pi-sim's scenarios/ or into pi-chart's encounter manifest |
| D11 | Per-minute aggregation policy beyond last-value | Demo trajectory is monotone enough that last-value matches min/max within tolerance | First scenario where intra-minute extremes are clinically meaningful (alarm-derived; PRD 005 will surface this first) |
| D12 | Encounter-existence precondition guard | Single hand-authored encounter MVP | Ingest is invoked from a runtime that doesn't pre-create encounters |

## 4. Acceptance criteria (testable)

Each criterion is written to defeat a trivial pass (empty file, broken-write that always returns no-op, fixture-as-oracle). Where a criterion can be passed by reading a hand-authored file instead of by running the system, the test setup must delete or move that file first.

1. **Round-trip vs source ticks (not against the hand-authored fixture).** `npm run ingest -- --patient patient_002 --encounter enc_p002_001 --replay-from <synthetic-tick-stream> --source-ref stepdown-monitor` writes ≥1 row per metric per minute that has source-tick coverage. The tick stream is **synthesized in S10** from the patient_002 fixture's three timestamps (09:00, 09:15, 09:30) by inverse-aggregation: emit ticks at 2 s cadence whose minute-aggregated `(name, sampled_at, value)` reproduces the fixture's three time slots. The ingest output is then asserted equal (modulo `sample_key`, `recorded_at`) to the fixture's three rows per metric on those minute slots; minutes with no source coverage produce no rows. This explicitly tests the per-minute aggregator, not byte-equality with a static file. Demo invocation MUST pass `--source-ref stepdown-monitor` (the patient_002 fixture's literal); the default `pi-sim-monitor` is for patient_001's existing fixture.
2. **Idempotency**: write count after first run > 0; write count after second run == first run; second run's `appendVital` calls all return `{written: false}` due to `sample_key` collision; no row appears twice in the output file.
3. **Validator clean with row-count floor**: `npm run validate -- --patient patient_002` returns 0 errors after ingest AND `wc -l patients/patient_002/timeline/2026-04-19/vitals.jsonl` ≥ 9.
4. **trend() proof with fixture-deletion**: in S10 the test (a) snapshots the existing `patients/patient_002/timeline/2026-04-19/vitals.jsonl` to a temp dir, (b) deletes the file, (c) runs ingest, (d) asserts `trend({metric: "spo2", encounterId: "enc_p002_001", from: "2026-04-19T09:00:00-05:00", to: "2026-04-19T09:30:00-05:00", scope})` returns ≥3 points whose values are exactly `[92, 88, 89]`, (e) restores the snapshot at teardown. The metric identifier `"spo2"` is the literal used in the fixture (verified) — the test must fail with a clear error if `pi-chart/src/vitals.ts` ever renames the canonical key.
5. **Modularity proof against existing patient_001 fixture**: patient_001 already has 25 rows at `patients/patient_001/timeline/2026-04-18/vitals.jsonl` (`source.ref: pi-sim-monitor`, q10min cadence per the wiki entity). S11 (a) snapshots the file, (b) deletes it, (c) runs `npm run ingest -- --patient patient_001 --encounter enc_001 --replay-from <synthesized-from-snapshot>` with default `--source-ref pi-sim-monitor`, (d) asserts the regenerated file matches the snapshot row-set (same `(name, sampled_at, value, unit, source.ref)` tuples), (e) restores snapshot at teardown. **No `patient_002` literal in `pi-rn/ingest/src/`**: enforced by `grep -RE "patient_00[12]" pi-rn/ingest/src/` returning zero matches; literals are permitted only in `pi-rn/ingest/fixtures/` and `pi-rn/ingest/docs/`.
6. **Live mode proof with explicit duration assertion**: a slice-S10b test launches the scripted-replay backend (S8) at `TIME_SCALE=120` (2 sim min per wall second) for ≥15 wall seconds; ingest runs in `--watch`; at wall t=20 s the test asserts (a) the watcher wrote ≥30 rows, (b) `sampled_at` is strictly monotonic per metric, (c) source-side tick count ≥ 600 (i.e. ≥1 sim-Hz held). Delete-and-restore the patient_002 file as in #4 to keep the test hermetic.
7. **Boundary (import statements only, not text matches)**: `grep -RnE "(from|require)\\(?[\"'][.@/]*pi-sim" pi-chart/src/` returns zero matches (the existing `fs-util.ts:3` text comment that mentions `pi-sim` is intentionally not flagged). `grep -RnE "(from|require)\\(?[\"'][.@/]*pi-chart" pi-sim/scripts/` returns zero matches. The ingest package (S0) is the only place that may import from both — verified by inspection.

## 5. Slices (agent-executable)

Each slice is a discrete, self-verifying unit. Order is dependency order; slices marked **‖** can run in parallel after their prerequisites land. Each slice header is the agent-prompt summary.

### S0 — Package + monorepo workspace scaffold

**Agent**: `executor` (sonnet)
**Prereq**: confirmed during review — `/home/ark/pi-rn/package.json` does **not** exist today; pi-sim, pi-chart, pi-agent are independent npm packages with no shared root. S0 owns the workspace decision.
**Touches**: `pi-rn/package.json` (NEW; `{ "private": true, "workspaces": ["pi-chart", "pi-sim", "pi-agent", "ingest"] }`), `pi-rn/ingest/package.json` (declares `pi-chart` as a workspace dep), `pi-rn/ingest/tsconfig.json` (extends a baseline; project-references to pi-chart for type-only imports), `pi-rn/ingest/src/index.ts` (empty re-export), `pi-rn/.gitignore` augmentation if needed.
**Decision rule**: prefer npm workspaces. If the operator rejects the workspace creation (it ripples into every existing package's `node_modules` resolution), fall back to a `tsconfig.json` `paths` map plus a build-time copy of `formatVitalSampleKey` (Risk #3, downgraded). Document the choice in `pi-rn/ingest/docs/architecture.md`.
**Verify**:
1. `cd pi-rn && npm install` succeeds.
2. `cd pi-rn/pi-chart && npm test` still green (existing tests untouched).
3. `cd pi-rn/pi-sim && npm run typecheck` still green.
4. `cd pi-rn/ingest && npx tsc --noEmit` succeeds against an empty `index.ts`.
5. `cd pi-rn/ingest && node -e "import('pi-chart').then(m => console.log(m.formatVitalSampleKey ? 'ok' : 'FAIL'))"` prints `ok` (proves `formatVitalSampleKey` resolves through the workspace before S6 lands).
**Why third package**: keeps pi-sim untouched on Pulse path; keeps pi-chart's `pi-sim-never-imported` boundary intact. Mirrors the pi-chart README "monitor extension" framing.

### S0a — Export `formatVitalSampleKey` from `pi-chart` public surface (if not already)

**Agent**: `executor` (sonnet)
**Touches**: `pi-chart/src/index.ts` (add `export { formatVitalSampleKey } from "./vitals.js"` if missing), `pi-chart/src/vitals.test.ts` (one-line "exported by index" guard test)
**Verify**: the S0 step-5 verify command now passes against `from "pi-chart"` (not deep `from "pi-chart/src/vitals"`), confirming public-API reachability. Removes Risk #3 entirely.

### S1 — Field-mapping spec (no code) ‖ S0

**Agent**: `writer` (haiku)
**Touches**: `pi-rn/ingest/docs/field-map.md`
**Content**: A table — pi-sim field name → pi-chart canonical `name` + `unit` + retained / dropped / derived. Cover all 17+ Pulse-native fields from `pi-sim/vitals/README.md`. Mark `cardiac_output_lpm`, `stroke_volume_ml`, `pao2_mmHg`, `paco2_mmHg`, `etco2_mmHg`, `lactate_mmol_l`, `hgb_g_dl`, `urine_ml_hr`, `ph` as second-pass (not on Agent Canvas hot path).
**Verify**: doc reviewer (`code-reviewer`, haiku) confirms every pi-sim field has a row.

### S2 — Translator (pure) ‖ S1

**Agent**: `executor` (sonnet)
**Touches**: `pi-rn/ingest/src/translate.ts`, `pi-rn/ingest/src/translate.test.ts`
**API**:
```ts
type PulseTick = { t: number; wallTime: string; hr: number | null; bp_sys: number | null; /* ... */ };
type CanonicalSampleDraft = {
  name: string; value: number | null; unit: string;
  // sampled_at, recorded_at, sample_key, subject, encounter_id, source, context
  // are added by later slices.
};
export function translate(tick: PulseTick): CanonicalSampleDraft[];
```
**Verify**: unit tests cover every field in S1's map; `null` → drop sample; unit conversions explicit (no inference).

### S3 — Clock translator (pure) ‖ S1

**Agent**: `executor` (sonnet)
**Touches**: `pi-rn/ingest/src/clock.ts`, `pi-rn/ingest/src/clock.test.ts`
**API**:
```ts
export function pulseToChartTime(args: {
  pulseT: number;          // sim seconds since scenario start
  scenarioStartT: number;  // sim seconds where the run began (usually 0)
  chartSimStart: string;   // chart.yaml sim_start (ISO UTC)
  chartTimezone: string;   // chart.yaml timezone (e.g. "America/Chicago")
}): { sampledAt: string }; // ISO with offset
```
**Verify**: tests assert `pulseT=0, scenarioStartT=0, chartSimStart="2026-04-19T13:00:00.000Z"` ⇒ `sampledAt="2026-04-19T08:00:00-05:00"` (DST-correct for America/Chicago); `pulseT=3600` ⇒ `09:00:00-05:00`.

### S4 — Encounter context manifest (load + merge) ‖ S1

**Agent**: `executor` (sonnet)
**Touches**: `pi-rn/ingest/src/encounterContext.ts`, `pi-rn/ingest/src/encounterContext.test.ts`, `pi-rn/ingest/fixtures/patient_002-enc_p002_001.context.yaml` (waypoint context schedule)
**Schema**:
```yaml
encounter_id: enc_p002_001
default:
  o2_device: nasal_cannula
  o2_flow_lpm: 3
schedule:
  - at_sim_time: "2026-04-19T09:30:00-05:00"
    o2_device: simple_mask
    o2_flow_lpm: 6
```
**API**:
```ts
export function contextFor(metric: string, sampledAt: string, manifest: ContextManifest): Record<string, unknown> | undefined;
```
**Verify**: tests confirm `spo2` row at 09:30 picks up `simple_mask / 6 L` per fixture; `heart_rate` rows have no context.

### S5 — Per-minute aggregator (pure) ‖ S2, S3

**Agent**: `executor` (sonnet)
**Touches**: `pi-rn/ingest/src/aggregate.ts`, `pi-rn/ingest/src/aggregate.test.ts`
**Policy** (explicit): for each `(metric, minute-aligned sampled_at)` window, emit one row with `value = last source-tick value within the window`. Minutes with **zero source ticks emit no row** (the aggregator is a coverage filter, not an interpolator). Last-value is the MVP default; the call site is a single-export `pickPolicy` constant — D11 in §3a names the swap trigger. The aggregator does not invent timestamps; it round-down-floors `sampled_at` to the minute boundary in the chart's timezone.
**API**:
```ts
export type AggregationPolicy = "last-in-window"; // future: "mean" | "median" | "max-deviation"
export function aggregateMinute(
  samples: CanonicalSampleDraft[],
  opts: { policy: AggregationPolicy; timezone: string },
): CanonicalSampleDraft[];
```
**Verify**: (a) 30 ticks at 2 s cadence inside one minute collapse to 1 row per metric (last-value); (b) ticks split across two minutes produce 2 rows per metric; (c) a minute with zero source ticks produces zero rows (coverage filter); (d) DST forward-jump in `America/Chicago` does not produce a duplicate or missing row (test the 2026-03-08 transition explicitly).

### S6 — Sample-key + finalizer ‖ S2, S3, S4, S5

**Agent**: `executor` (sonnet)
**Prereq**: S0a (so `import { formatVitalSampleKey } from "pi-chart"` resolves through the public API, not a deep import).
**Touches**: `pi-rn/ingest/src/finalize.ts`, `pi-rn/ingest/src/finalize.test.ts`
**Detail**: import `formatVitalSampleKey` from `"pi-chart"` (workspace dep; not deep `pi-chart/src/vitals.ts`). Compose final `VitalSample` rows ready to write.
**Verify**: tests reproduce `vital_ba81122d82edd55e` (the fixture's first heart_rate row sample_key) given the matching inputs (`subject: patient_002`, `encounter_id: enc_p002_001`, `name: heart_rate`, `sampled_at: 2026-04-19T09:00:00-05:00`, `source.kind: monitor_extension`, `source.ref: stepdown-monitor`, `value: 96`, `unit: beats/min`). If the digest differs, fail loud with both digests printed — pi-chart's hash function changed and PRD must rebaseline.

### S7 — pi-chart write entrypoint: `appendVital`

**Agent**: `executor` (sonnet) — touches pi-chart, requires read of `pi-chart/src/write.ts`, `vitals.ts`, `validate.ts`, `read.ts`
**Prereq**: independent of S0/S0a (lives entirely in pi-chart). Slice graph node, not a dependency of S0.
**Touches**: `pi-chart/src/write.ts` (new export `appendVital`), `pi-chart/src/index.ts` (re-export), `pi-chart/src/write.test.ts` (cover happy path + sample_key collision-same-value suppress + sample_key collision-different-value error)
**API**:
```ts
export async function appendVital(
  sample: VitalSample,
  scope: PatientScope,
): Promise<{ written: boolean; path: string; sample_key: string; collision?: "same-value" | "different-value" }>;
```
**Behavior**:
1. Resolves the day file from `sample.sampled_at` in chart timezone (NOT process timezone). Creates day dir if absent.
2. Reads existing rows linearly to check for `sample_key` collision (acceptable for MVP single-writer; D5 in §3a names the file-locking deferral).
3. **No collision**: append a complete JSON line atomically (write to a temp file in the same dir, fsync, rename).
4. **Collision, same value**: return `{written: false, collision: "same-value"}` — idempotency case.
5. **Collision, different value** (D4): throw an `AppendVitalCollisionError` with both stored and incoming `value` so the caller can decide. Default ingest CLI exits non-zero. This protects against silent fixture-edit drift.
**Verify**:
- Write test re-invokes twice with identical sample → file has one row, second call returns `{written: false, collision: "same-value"}`.
- Write test invokes twice with same sample-key inputs but different `value` → second call throws; file is unchanged.
- Day-rollover test: two samples 30 sim-min apart spanning midnight America/Chicago land in two different day files, no truncation.

### S8 — Replay driver in pi-sim (scripted-physiology backend)

**Agent**: `executor` (sonnet) — touches pi-sim
**Touches**: `pi-sim/scripts/replay.ts` (new), `pi-sim/scenarios/replay/<scenario>.yaml` (NEW directory; demo seed file is `pi-sim/scenarios/replay/respiratory_decompensation_q15.yaml` — name describes the trajectory shape, NOT the patient), `pi-sim/scripts/types.ts` (extend), `pi-sim/package.json` (`monitor:replay` script that takes `--scenario <path>`)
**Patient-agnosticism rule**: scenario filenames in pi-sim describe the trajectory (`respiratory_decompensation_q15`, `hemorrhagic_shock`), NOT the patient. The patient binding is exclusively in the ingest layer (`pi-rn/ingest/fixtures/<patient>-<encounter>.context.yaml`) which references the scenario by name. This keeps pi-sim's scenarios reusable across patients.
**Behavior**: reads waypoint YAML (waypoints at relative sim seconds: t=0 / t=900 / t=1800 with HR/RR/SpO2), interpolates linearly between waypoints, emits `vitals/current.json` at `TIME_SCALE`-paced ticks. **Does not call Pulse.** Same output schema as the existing monitor.
**Verify**: `npm run monitor:replay -- --scenario pi-sim/scenarios/replay/respiratory_decompensation_q15.yaml` produces ticks whose values match waypoint targets at the waypoint timestamps within ±0.5 of the integer value. `grep -RnE "patient_00[12]" pi-sim/scripts/ pi-sim/scenarios/` returns zero matches.

### S9 — Ingest watcher + CLI (sequential after S6, S7, S8)

**Agent**: `executor` (sonnet)
**Prereq**: S6, S7, S8 — sequential, not parallel.
**Touches**: `pi-rn/ingest/src/watch.ts`, `pi-rn/ingest/src/cli.ts`, `pi-rn/ingest/package.json` (bin), `pi-rn/package.json` (workspace script `npm run ingest --workspace=ingest`)
**CLI flags** (single source of truth — `--replay` does not exist; use `--replay-from`):
```
--patient <id>            required, no default
--encounter <id>          required, no default
--chart-root <path>       default ./pi-chart resolved from process cwd
--source <path>           live mode: ./pi-sim/vitals/current.json (file watched for atomic-write events)
--replay-from <path>      one-shot mode: reads pi-sim/vitals/timeline.json (array of frames). Mutually exclusive with --watch.
--watch                   live mode. Mutually exclusive with --replay-from.
--source-ref <name>       default pi-sim-monitor (matches patient_001 fixture); patient_002 demo MUST pass stepdown-monitor
--context <path>          default ./pi-rn/ingest/fixtures/<patient>-<encounter>.context.yaml; resolution failure errors loud
--scenario-start-t <s>    default 0
--gap-policy <forward|halt>  default halt (--watch only). D7 in §3a names the long-term decision.
```
**Behavior**: exactly one of `--watch` / `--replay-from` is required. CLI rejects both-or-neither. In `--replay-from` mode, all timeline rows are translated → aggregated → finalized → written sequentially; CLI exits 0 if every write returned `{written: true|false}` with no `collision: "different-value"`, non-zero with a clear stderr otherwise.
**Verify**: `npm run ingest --workspace=ingest -- --replay-from pi-rn/ingest/fixtures/patient_002-enc_p002_001.timeline.json --patient patient_002 --encounter enc_p002_001 --source-ref stepdown-monitor` populates the chart and exits 0; second invocation exits 0 with `wrote 0 / total N` (idempotency); third invocation with a `--source-ref` typo exits non-zero with a clear "different-value collision" message.

### S10 — Round-trip test (sequential after S9)

**Agent**: `test-engineer`
**Prereq**: S9.
**Touches**: `pi-rn/ingest/src/roundtrip.test.ts`, `pi-rn/ingest/fixtures/patient_002-enc_p002_001.timeline.json` (synthesized in this slice from the existing 9 vitals.jsonl rows by inverse-aggregation: emit ticks at 2-s cadence whose minute-aggregated values reproduce the three time slots), `pi-rn/ingest/fixtures/patient_002-enc_p002_001.context.yaml`, `pi-rn/ingest/fixtures/expected/patient_002-enc_p002_001.vitals.jsonl` (snapshot of the live fixture frozen at slice-author time)
**Behavior**:
1. Snapshot `patients/patient_002/timeline/2026-04-19/vitals.jsonl` to a tmpdir; delete it.
2. Run ingest CLI with `--replay-from <synth-timeline> --source-ref stepdown-monitor`.
3. Assert the regenerated file row-set equals the snapshot row-set on `(name, sampled_at, value, unit, source.ref, context)`. `sample_key` is recomputed deterministically from inputs and asserted equal too. `recorded_at` may differ — assert it is ISO-formatted within ±5 s of `sampled_at`.
4. Run ingest a second time; assert file unchanged and CLI exits 0 with `wrote 0`.
5. Run `npm run validate -- --patient patient_002`; assert 0 errors.
6. Restore the snapshot at teardown (always, even on failure) so the patient_002 fixture is never left damaged.
**Verify**: this slice's tests pass under `cd pi-rn/ingest && npm test`. The expected-snapshot file (`pi-rn/ingest/fixtures/expected/...`) is committed so future fixture edits surface as test failures, not silent drift (Risk 1 mitigation).

### S10b — Live mode duration test (sequential after S9)

**Agent**: `test-engineer`
**Prereq**: S9, S8.
**Touches**: `pi-rn/ingest/src/live.test.ts`
**Behavior**:
1. Snapshot + delete patient_002 vitals.jsonl as in S10.
2. Spawn `npm run monitor:replay -- --scenario pi-sim/scenarios/replay/respiratory_decompensation_q15.yaml TIME_SCALE=120` as a child process.
3. Spawn ingest in `--watch` mode; let it run for 20 wall-seconds (= ~40 sim-min at TIME_SCALE=120; safely > the 30-sim-min acceptance floor).
4. Kill both processes.
5. Assert (a) ingest wrote ≥30 rows total, (b) `sampled_at` is strictly monotonic per metric, (c) source emitted ≥600 ticks (≥1 sim-Hz held).
6. Restore the snapshot at teardown.
**Verify**: `cd pi-rn/ingest && npm test -- --grep live` passes locally; CI may skip if it cannot spawn child processes, with a comment naming the limitation.

### S11 — Modularity / patient_001 regression test (sequential after S10)

**Agent**: `test-engineer`
**Prereq**: S10.
**Critical context**: patient_001 ALREADY has 25 rows at `patients/patient_001/timeline/2026-04-18/vitals.jsonl` with `source.ref: pi-sim-monitor` (verified during PRD review). S11 must snapshot-and-restore, never overwrite-and-leave-broken.
**Touches**: `pi-rn/ingest/fixtures/patient_001-enc_001.context.yaml` (waypoints derived from the existing patient_001 vitals.jsonl), `pi-rn/ingest/fixtures/patient_001-enc_001.timeline.json` (inverse-aggregation from same), `pi-rn/ingest/src/modularity.test.ts`, `pi-rn/ingest/fixtures/expected/patient_001-enc_001.vitals.jsonl` (snapshot of the live fixture frozen at slice-author time)
**Behavior**:
1. Snapshot `patients/patient_001/timeline/2026-04-18/vitals.jsonl` to a tmpdir; delete it.
2. Run ingest CLI: `npm run ingest --workspace=ingest -- --replay-from <patient_001-timeline> --patient patient_001 --encounter enc_001` (no `--source-ref` — default `pi-sim-monitor` is correct for patient_001).
3. Assert regenerated row-set matches the snapshot on `(name, sampled_at, value, unit, source.ref)`.
4. Run validator on patient_001; assert 0 errors.
5. Restore snapshot at teardown.
6. Patient-agnosticism guard: `grep -REn "patient_00[12]" pi-rn/ingest/src/` returns zero matches; `grep -REn "patient_00[12]" pi-rn/ingest/fixtures/` returns matches only in fixture filenames + contents (acceptable per §Cross-cutting decisions).
**Verify**: tests pass; teardown leaves both patient files exactly as committed.

### S12 — patient_002 demo runbook

**Agent**: `writer` (haiku)
**Touches**: `pi-rn/ingest/docs/demo-patient_002.md`
**Content**: terminal-by-terminal sequence — pulse skipped (replay backend), `npm run monitor:replay` in one terminal, `npm run ingest -- --watch ...` in another, expected `tail -f vitals.jsonl` output, expected `trend()` JSON.
**Verify**: `code-reviewer` (haiku) confirms commands match the actual CLI flags from S8 + S9.

### S13 (stretch) — Latent-state marker memo

**Agent**: `architect` (opus, READ-ONLY)
**Touches**: `pi-rn/ingest/docs/latent-state.md` (proposal memo only)
**Why**: ADR 002 §5 names `<Latent>` → `<Chart>` as a state machine but defers the contract (D2 in §3a). The memo asks two questions and recommends one path: (a) is `source.kind = monitor_extension` itself the implicit latent marker (current behavior); (b) does each row need an explicit `quality: "latent"` or `data.review_status: "unreviewed"` field; (c) what does promotion look like — supersession event vs in-place update vs sidecar review log?
**Trigger** (revised): unconditional — the memo is short and feeds the future promotion ADR. The previous "if S10 surfaces ambiguity" gate was unfireable because S10 only proves byte-equality with a fixture that has no latent marker. Drop the gate; ship the memo.
**Verify**: `code-reviewer` (haiku) confirms the memo names the three options, the demo's choice (option a — implicit latent), the cost of each option, and a recommendation for the future ADR. No code changes.

### S14 (stretch) — Multi-model architecture review

**Agent**: `document-specialist` orchestrating `omc:ask codex` + `omc:ask gemini`
**Touches**: `pi-rn/ingest/docs/architecture-review.md`
**Question**: "For pi-sim → pi-chart vitals ingest in this monorepo, is the standalone third-process topology the right scaling primitive for hi-fi multi-patient later? What structural optimizations should we name in this PRD?" Carries the resolved choices in §3 as context.
**Why now**: user explicitly requested codex input + structural-optimization notes. Ship as a memo, not as code changes — memo informs the next iteration's PRD, not this one.

## 6. Slice dependency graph

`‖ X` in slice headers means "may run in parallel with X once both prereqs are met"; absence of `‖` means strictly sequential. The graph below reflects the corrected dependencies after PRD review.

```
S0 (workspace) ──► S0a (export sample-key) ──► S1 (field map) ─┐
                                                               │
                  S1 ──► S2 (translate) ──┐                    │
                  S1 ──► S3 (clock) ──────┤                    │
                  S1 ──► S4 (context) ────┤                    │
                                          │                    │
                                S5 (aggregate) ◄── S2, S3      │
                                          │                    │
                                S6 (finalize) ◄── S0a, S2-S5 ──┘
                                          │
S7 (appendVital, in pi-chart) ── independent root, parallel with S0..S6
S8 (replay backend, in pi-sim) ── independent root, parallel with S0..S7
                                          │
                                S9 (CLI + watcher) ◄── S6, S7, S8
                                          │
                                          ├──► S10 (round-trip) ──► S11 (modularity)
                                          ├──► S10b (live-mode duration)
                                          └──► S12 (runbook)

S13 (latent-state memo) — independent stretch, parallel with anything
S14 (codex/gemini architecture review memo) — independent stretch, parallel with anything
```

**Critical-path length** (sequential): S0 → S0a → S1 → (S2|S3|S4) → S5 → S6 → S9 → S10 → S11. ~9 slices serialized; the rest fan out.

## 7. Out of scope (named here so future PRDs know)

- Multi-patient concurrent ingest (one ingest per encounter; see ADR 002 sub-decision #5).
- `<Latent>` → `<Chart>` promotion API (deferred per ADR 002 §5; partially named in S13).
- Pulse-driven physiology for patient_002 (Pulse stays dormant per ADR 002 §6).
- pi-sim → pi-chart waveform / high-fidelity capnography upload (current.json carries summary fields only).
- HTTP transport (file-watcher is sufficient for MVP; HTTP is a topology swap when multi-patient surfaces).
- Encounter auto-creation (encounter must already exist in pi-chart; ingest does not author encounter manifests).

## 8. Risks

1. **patient_002 fixture drift.** The fixture vitals.jsonl is hand-authored. If a clinical edit lands during this PRD's execution, S10's expected snapshot (`fixtures/expected/patient_002-enc_p002_001.vitals.jsonl`) must be regenerated. Mitigation: snapshot is committed under `fixtures/expected/` so any drift surfaces as a test diff in code review, not a silent pass. Risk 1's earlier "regenerate expected from inputs" mitigation is dropped — that wires the test as a tautology (architect + critic both flagged).
2. **Per-minute aggregation policy ambiguity.** Last-in-window may not be clinically right (mean, median, max-deviation are alternatives). For a deteriorating SpO2 trajectory the nadir within a minute matters; last-value can hide it. Mitigation: S5's API isolates the policy via `AggregationPolicy` constant; D11 in §3a names the trigger for switching the default. Until then, document the bias in `pi-rn/ingest/docs/aggregation-policy.md` so any agent reading the rows knows the semantics.
3. ~~Sample-key import boundary.~~ Resolved by S0 + S0a (workspace + public export). Removed from risk list.
4. **Encounter context manifest ownership.** Manifests live in the ingest package's `fixtures/` dir today, which is a category violation (production code reads from a fixtures dir at runtime). Acceptable for MVP because the only encounters are demo + regression; D10 in §3a names the trigger for moving manifests into a real config location.
5. **DST and timezone correctness.** `chart.yaml` declares `timezone: America/Chicago`. The 2026-03-08 spring-forward transition produces a missing 02:00–03:00 hour in CST→CDT. S3 and S5 must both handle the transition without silently dropping or duplicating samples. Mitigation: S3 verify and S5 verify each include an explicit DST-transition test case.
6. **sample_key collision under concurrent encounters.** Two encounters writing to the same minute slot can in principle produce the same `sample_key` if `(subject, encounter_id, name, sampled_at, source.kind, source.ref, value, unit)` collide. Practically rare (encounter_id usually differentiates); explicitly out of scope per §2 non-goals. D3 in §3a names the trigger.
7. **Watcher missed-tick / file-watcher dropped events.** Node `fs.watch` is known to drop events under load. `--watch` mode default `--gap-policy halt` exits non-zero rather than silently miss data. D7 in §3a names the long-term fix (polling fallback, exactly-once via file-revision counter). Demo runs are short enough that drops are unlikely.
8. **`appendVital` mid-batch failure semantics.** A crash or write error mid-batch could leave `vitals.jsonl` partially written. Mitigation: S7's atomic-rename pattern (write to a temp file in the same dir, fsync, rename) guarantees per-row atomicity. Multi-row atomicity (e.g. an aggregator emitting N samples per minute boundary) is not provided; if the process dies between rows, only the rows up to the crash are committed. D8 in §3a names the future batch-API.
9. **PRD 005 alarm-passthrough coupling.** S2's translator drops `current.json`'s `alarms[]`. When PRD 005 deepens, it must either (a) extend S2 to ALSO emit alarm events, or (b) re-read `current.json` on a sidecar channel. Forward-compat note: keep S2's translator pure on the vitals path; the alarm channel may compose with it but must not modify it.

## 9. Cross-references

- ADR 002 — three-stream topology; this PRD implements the Vitals stream.
- pi-chart `src/vitals.ts` — `formatVitalSampleKey`, canonical metric set.
- pi-chart `src/views/trend.ts` — read surface validated by acceptance #4.
- pi-chart `memos/patient-002-clinical-review-26042026.md` — clinical-safety boundaries this PRD must preserve.
- pi-chart `pi-chart.yaml` — `patient_002` registry entry; encounter id `enc_p002_001` from the fixture.
- pi-sim `vitals/README.md` — current.json schema; the source of S2's translator inputs.
- pi-rn `AGENTS.md` — boundary rule that motivates S0's standalone-package decision.
