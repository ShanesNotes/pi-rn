# pi-rn Re-entry Audit — 2026-05-28

> Produced by an 8-surveyor audit workflow (each survey ran the real test suites) + inline verification of the load-bearing claims. This is a *vision* document for an architect returning after time away: what is done, what is drifting, where the unimplemented refactor actually stands, and the decision forks that gate the next swarm.

## TL;DR — where "the refactor" actually stands

The "v0.5 substrate refactor" is **two halves**, and they are in opposite states:

1. **The reusable claim-ledger kernel — DONE.** It was relocated out of pi-chart into the sibling `pi-ledger/` (Rust) per ADR 020, and it is real: K0–K12, **128 tests green, clippy clean with `-D warnings`, a real SHA-256 canonicalization golden vector, and ADR-008's frozen+test-guarded public interface inventory**. It is *adapter-ready* — the interface is no longer being discovered.
2. **pi-chart rebased onto that kernel — NOT done.** `pi-chart/src/` is still the intact brownfield 0.3.0-partial prototype (396 tests green, but still `EventEnvelope`/filesystem/views — zero `Claim`/ledger code). The pi-chart↔pi-ledger **adapter is docs-only and gated** behind an unmade human decision (issue 04: the Rust↔TS integration mechanism).

So your memory is right — the refactor "hasn't been implemented." More precisely: **the substrate was built, just in pi-ledger; the chart was never moved onto it.** And the next step is *not* to start the adapter — it's blocked. The named prerequisite is making pi-chart's per-patient substrate fields explicit first.

## State map (verified)

| Subproject | Proof-state | Headline |
|---|---|---|
| **pi-ledger** | shipping | Kernel done, K0–K12, adapter-ready. 128 tests green, ADR-008 interface frozen. The healthiest *substrate*. |
| **pi-monitor** | shipping | Healthiest subsystem overall: clean boundary, contract byte-in-sync with pi-sim, all 3 gates green. Polish-only gaps. |
| **pi-sim** | shipping (producer) | Public telemetry contract locked enough to build against (10 lanes, 4 golden fixtures, hidden-state leak test passes). Consumer adapter (`pi-rn/ingest/`) unbuilt. |
| **pi-chart** | mixed | Views layer + patient-agnostic agent-canvas connector are real & green. **Substrate refactor not started.** Product vocabulary (Shift Brain, ContextPacket…) mostly docs-only; code still uses deprecated names. |
| **pi-agent** | planned/stub | Near-empty scaffold (1 empty extension stub). M7 public-read boundary smoke fully specced but unbuilt. Boundary holds *trivially* (no code to violate it). |
| **boundaries** | clean | **No real cross-project import violations.** Every "hit" is doc/comment/test-fixture/guard-test. All 4 verification entrypoints pass green. |

## Drift & cleanup register (verified, concrete)

| # | Issue | Evidence | Severity |
|---|---|---|---|
| D1 | **Orphan kernel duplicate.** `pi-chart/src/claim-ledger/canonical.ts` is untracked, never committed, duplicates the Rust kernel's canonicalization (same id `jcs-rfc8785-pi-chart-v1`), sits at the exact path ADR 020 forbids, and is swept into `npm test` — so the 396-count depends on an uncommitted file. | `git status ??`; `package.json` test glob; ADR 020 §Consequences | high |
| D2 | **Per-patient substrate-field PRD barely started.** The named prerequisite for *both* the adapter and any chart impl is a single draft terminology map — no PRD, no issues. On the critical path, barely begun. | `.scratch/pi-chart-per-patient-substrate-field-interface/` (1 file) | high |
| D3 | **Adapter gate understates kernel.** Gate says "K0-K6 complete" but kernel shipped K0-K12; a maintainer may not realize the evidence already exceeds the gate, stalling the decision. | `adapter-readiness-gate.md:18,40,43` vs pi-ledger reality | medium |
| D4 | **Vocabulary drift.** Code ships `memoryProof`/`contextBundle`; CONTEXT.md designates these deprecated, canonical names `ContextPacket`/`ContextReceipt`. Product surfaces (Shift Brain, Report View, Handoff View, Chart Review Packet) have zero code. | CONTEXT.md:38,230-231 vs `src/views/*` | medium |
| D5 | **ADR-numbering memo factually wrong.** Says "next ADR is 019 / sequence ends at 018"; 019 **and** 020 exist and are accepted. | `pi-chart/memos/adr-numbering-reconciliation-20260503.md:17,29` | low |
| D6 | **PLANNING.md stale body.** Bannered historical, but its "current authority" table still names `pi-chart/src/vitals.ts` and an uncreated `ingest/`, contradicting CONTEXT-MAP's 5-subproject matrix. | `PLANNING.md:30-38` | low |
| D7 | **Superseded PRD unmarked.** `pi-chart-lean-v0-5-substrate-strategy` (May 4, no issues) is superseded by the `-shift-brain` variant (15 issues, actively committed) but not marked so. | two `.scratch` PRDs | low |
| D8 | **Dirty canonical doc.** `pi-chart/CONTEXT.md` is a large uncommitted clinician-vocabulary expansion; companion terminology-map untracked. Internally consistent, but the canonical doc sits dirty. | `git status M`; untracked map | low |

## Ranked opportunities (proof-before-polish)

1. **(product-proof prerequisite)** Promote `per-patient-substrate-field-interface` → PRD + issues. Makes pi-chart's canonical fact/action/note/ref fields explicit. *Gates everything chart-side.* — depends on: nothing.
2. **(refactor blocker decision)** Make the Rust↔TS integration-mechanism decision (issue 04). The single hard HITL blocker for the adapter. — depends on: your call.
3. **(boundary-proof)** Build pi-agent M7 public-read smoke. The only execution-ready spec; converts the "no hidden pi-sim coupling" boundary from *stated* to *enforced*. — depends on: ownership of the spec (currently mis-filed under `pi-sim/.omx/plans`).
4. **(cleanup)** Resolve orphan D1 + fix factual doc drift D3/D5/D6/D7. Mechanical, de-risks the adapter slice. — depends on: D1 disposition decision.
5. **(docs-alignment)** ContextPacket/ContextReceipt rename or explicit alias-ADR (D4). — depends on: staging decision.

## Recommended next workflow (pending your grill answers)

A **plan-then-PRD** workflow on the per-patient substrate fields (opportunity 1) — *not* an implementation swarm at the adapter seam, which is HITL-blocked and crosses the unstable boundary your own guidance says to spec-not-implement. The cleanup items (4) can run as a parallel low-risk sweep. The adapter itself stays gated until issue 04 lands.

## Decision forks (the grill)

- **F1 — Next lane:** substrate-field PRD (recommended) vs adapter mechanism decision vs pi-agent M7 vs cleanup-first.
- **F2 — Orphan D1 disposition:** delete vs freeze-as-golden-vector-in-pi-ledger vs keep vs commit-in-place.
- **F3 — Rust↔TS integration mechanism (issue 04):** child-process/CLI vs WASM vs native-addon vs regenerate-in-TS vs defer.
- **F4 — Cleanup scope:** mechanical-now+defer-rename vs full-rename-now vs facts-only vs skip.

## Outcome (2026-05-29)

Architect decisions + executed work:

- **F1 → Substrate-field PRD.** Authored `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md` (interface spec for the per-patient charted-clinical-fact field set + per-field kernel mapping, 15 tracer issues, `Status: needs-triage`). Next: `$to-issues` after triage.
- **F2 → Delete orphan.** `pi-chart/src/claim-ledger/` removed; suite 396→389, green.
- **F4 → Full rename.** `contextBundle→contextPacket` (+ `ContextBundle`/`ContextBundleParams` types, file `bundle.ts→contextPacket.ts`) in `src/views/`; `memoryProof` kept as internal projection; `ContextReceipt` deferred. Plus all D3/D5/D6/D7 doc fixes applied.
- **F3 → shared clinical-truth service.** Reframed from "embed in TS" to a shared Rust truth service (pi-ledger→service, gRPC/UDS, contract-first); pi-chart a client. Recorded **proposed** in `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md` → promote to pi-ledger ADR 009 + pi-chart ADR 021 on acceptance.

Pending architect action: accept the truth-service proposal (+ its open sub-decisions); triage/`$to-issues` the substrate-field PRD. Adapter implementation stays gated (spec-not-implement at the unstable seam).
