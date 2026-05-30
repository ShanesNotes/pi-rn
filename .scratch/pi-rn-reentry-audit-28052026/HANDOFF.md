# HANDOFF — pi-rn re-entry / substrate-field session (2026-05-29)

> Pick-up point for the next session. Committed on branch **`reentry-substrate-field-spec`** (pushed). Durable context is in memory (`project_v05_refactor_state`, `feedback_latency_clinical_runtime`) — read those first. This doc only carries what isn't already in the artifacts below.

## One-line state

The kernel is **done** (pi-ledger, K0–K12, adapter-ready); pi-chart is **not rebased** onto it. This session audited the workspace, cleaned the drift, and produced the spec that gates the rebase. **Code is one decision-round away** — blocked only on architect decisions, not on more analysis.

## Artifacts (read, don't re-derive)

- **Audit + state map:** `.scratch/pi-rn-reentry-audit-28052026/AUDIT.md`
- **Substrate-field PRD + 15 issues + reconciliation:** `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`, `issues/01–15`, `issues/RECONCILIATION.md`
- **Truth-service decision proposal:** `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`
- **Kernel public interface (the mapping target):** `pi-ledger/docs/ledger-core-public-interface.md`

## Executed this session (all committed)

Orphan `pi-chart/src/claim-ledger/` deleted (suite 396→389 green); `contextBundle→ContextPacket` rename in `src/views/` (`bundle.ts→contextPacket.ts`, `memoryProof` kept as internal projection, `ContextReceipt` deferred); 16 stale-doc fixes (ADR-numbering memo, adapter gate K0-K6→K0-K12, superseded old lean-v0-5 PRD, PLANNING.md `ingest/`); substrate-field PRD authored **and sliced** into 15 issues; truth-service proposal drafted.

## OPEN decisions that gate code — the whole reason we stopped at spec

**A. Nine `ready-for-human` field-spec decisions** (clinical semantics only the architect should settle). By issue:
- **02** — the 6→4 `factShape` collapse (incl. **OQ-4**: `context_segment` shape — rename predicate to `observation.context_segment` *(lean)* vs reshape to `context`)
- **03** — `(type,subtype)→predicateId` projection + production `PredicateRegistry`
- **04** — typed `object` per predicate (replaces magic-key `data`)
- **06** — controlled `source.kind` provenance vocabulary (multi-provider)
- **07** — unified `EvidenceRef` edge + dead-field closure
- **08** — `integrity` field + agreeing the `jcs-rfc8785-pi-chart-v1` canonicalization id with the kernel
- **09** — lifecycle vocabulary + correction Record-hash requirement
- **10** — `certainty` reconnection + Reviewed/Verified/Signed as separate facts
- **15** — kernel-mappability closeout (the 7 prerequisites) + boundary register

The 6 `ready-for-agent` issues (01, 05, 11, 12, 13, 14) mostly **interlock** with the above, so they aren't independently codeable until A is settled.

**B. Truth-service proposal — 4 sub-decisions** (architect chose the shared-service topology; these remain):
1. Transport — **gRPC over Unix-domain socket** recommended (vs Cap'n Proto RPC vs custom framed)
2. Storage engine for the durable per-patient append-only log (plain WAL vs redb/sled/SQLite)
3. Concurrency/consistency model (per-patient single-writer recommended)
4. Promotion — accept as `pi-ledger` ADR 009 + `pi-chart` ADR 021?

## Exact next step

1. **`grill-with-docs`** on A (the 9 field decisions) and B (the 4 sub-decisions), updating the issues / promoting the proposal to ADRs inline as each resolves.
2. Then run a **code-implementation `Workflow`** over the now-settled issues — pi-chart-internal field work first (no cross-seam), then the truth-service + client adapter once B is accepted.

## Carry these constraints (do not relitigate)

- **Spec, don't implement, at the pi-chart↔pi-ledger seam** until decisions land (`feedback_premature_implementation`).
- **Latency is first-class** — this is a production clinical-grade, real-time agent memory layer; never propose spawn-per-call/latency-dismissive transports (`feedback_latency_clinical_runtime`).
- Designed for **data-rich, multi-provider, multi-agent** scale — keep that lens.
- Connectors stay `(patientId, encounterId, asOf)`-parameterized; demo `patient_002/enc_p002_001`, regression `patient_001`.
- Kernel is **not widened** — the chart bends to the frozen Claim target.

## Suggested skills for next session

`grill-with-docs` (resolve A+B against the domain model) → `Workflow` (code implementation) → `to-issues` only if new implementation tickets are needed beyond the 15 spec issues.

## Not committed / left untracked (architect's pre-existing WIP — deliberately excluded)

`pi-chart/docs/design/Pi-chart Design System.zip`, `pi-chart/docs/design/pi-chart-logo.png`, `showcase/`, `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/lean-v0-5-shift-brain-review-deck.html` — design/presentation artifacts (possibly local-only sales assets). AUDIT.md flagged "commit vs keep local" as an open question; left untracked pending your call.
