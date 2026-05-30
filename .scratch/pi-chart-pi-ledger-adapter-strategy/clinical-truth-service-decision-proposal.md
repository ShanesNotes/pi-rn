# Decision proposal: clinical-truth service + adapter transport (resolves issue 04 direction)

Status: **proposed** (2026-05-29) — pending architect acceptance, then promote to `pi-ledger/docs/adr/009-clinical-truth-service.md` (+ a companion `pi-chart` ADR 021 for the client-adapter posture).
Decision owner: architect. Drafted from the re-entry audit + design pass (`.scratch/pi-rn-reentry-audit-28052026/AUDIT.md`).
Relates to: adapter `issues/04-integration-mechanism-decision.md`, `adapter-readiness-gate.md`, `pi-ledger/docs/ledger-core-public-interface.md` (ADR 008), `CONTEXT-MAP.md` seam matrix.

## Context

Issue 04 was framed narrowly as "pick the Rust↔TS integration mechanism." Two inputs reframe it into an architecture decision:

1. **Architect's runtime vision (2026-05-29):** the clinical memory is **one shared source of truth** that many agents/views/tools connect to — *not* a per-agent embedded copy. Speed and latency are first-class requirements: this is a real-time agent memory layer and clinical source of truth.
2. **Engineering analysis (design-pass F3 agent):** the kernel's public interface is **stateful** — `admission`/`point_read` take the same-patient *trusted entries* as input. A stateless per-call transport (spawn-per-call CLI, or wasm-as-pure-function) must either re-ship the whole patient ledger every call (O(history)) or evolve into "a long-lived stateful service with a wire protocol — at which point you have built a service." A second-language re-implementation (regen-in-TS) is rejected outright: it clones the canonicalization the kernel exists to own (ADR 020), creating two cryptographic sources of truth.

These converge: a **shared, stateful, low-latency clinical-truth service is the correct shape**, and it is what the architect independently chose.

## Decision (proposed)

**Grow `pi-ledger` from a library into a clinical-truth service**, and make `pi-chart` (and later `pi-agent`) **clients** of it.

1. **Service.** A long-lived Rust process wraps `ledger-core`, owns **durable per-patient append-only ledger storage**, and exposes *only* the ADR-008 safe consumer paths (`canonical_json`, `record_hash`, typed `RecordHash`/`EntryHash`/`CanonicalTimestamp`, `validate_claim` → `AppendAdmissibleClaim`/`RevisionAdmissibleClaim` → `append_admissible`/`append_revision_admissible`, `point_read`, snapshot/`from_snapshot`). Canonicalization/hashing runs **once, in Rust** — single source of truth, native speed.

2. **Contract-first (the real deliverable).** The load-bearing artifact is a **versioned service contract**: a typed schema over the ADR-008 interface, plus the kernel's **golden vectors promoted to a transport-agnostic conformance suite** (ADR 001 names the golden vector "the portability contract"). This mirrors the proven `pi-sim` pattern (a versioned `.lanes.json` + fixtures as consumer regression evidence — *not* a spawned process). The contract must (a) model how trusted entries cross the boundary without the client mutating-then-trusting them, and (b) never widen beyond the documented safe paths ("no contract-by-imitation," per ADR 008).

3. **Transport: gRPC over a Unix-domain socket** (recommended). The protobuf schema *is* the versioned contract; typed end-to-end; ~tens of µs locally; language-agnostic (Rust server, TS client via grpc-js, any future consumer); supports server-streaming for agents subscribing to memory updates. Latency floor is far below a runtime agent loop's needs. *Alternative if raw serialization latency ever dominates:* Cap'n Proto RPC (zero-copy). Transport sits **behind** the contract and is swappable.

4. **wasm as an optional client fast-path, not the mechanism.** A wasm build of just the *canonicalization* may be embedded in a client for local content-addressing/optimistic hashing without a round-trip — sharing the exact Rust bytes. Authority always remains the service.

5. **pi-chart stays TypeScript** as a fast client + projection/view layer; the heavy clinical-truth path is **Rust end-to-end** (service + kernel). This directly answers the "is this production-grade?" concern: the source-of-truth hot path is systems-grade Rust; TS hosts the clinician-facing views.

## Why not the alternatives (summary)

| Option | Verdict | Why |
|---|---|---|
| Spawn-per-call CLI | ✗ | ~5–50 ms/op spawn cost; must re-ship ledger state per call; invents a second text protocol beyond ADR-008; unavailable in browser/edge. |
| Embed in TS (native addon / wasm-as-everything) | ✗ as primary | Per-process copy contradicts "one shared source of truth"; native addon adds a per-platform binary matrix; wasm is awkward as the *durable store*. Good only as a client fast-path (#4). |
| Regenerate kernel in TS | ✗ | Two cryptographic implementations to keep in lockstep — the exact duplication ADR 020 removed. |
| **Shared Rust truth service (this proposal)** | ✓ | Single canonicalization source; shared, durable, concurrent; low-latency local IPC; contract-first; language-agnostic; production-clinical shape. |

## Implications / what changes

- Reshapes adapter **issue 04**: the "mechanism" is *client-of-a-truth-service over a versioned contract*, transport gRPC/UDS.
- New pi-ledger component: a **service crate** + a **durable storage layer** (the in-memory `AppendLedger` gains an append-only on-disk backing). This is net-new and is the largest build item.
- pi-chart adapter (adapter issues 05–09) becomes a **gRPC client + projection mapping**, against the conformance suite — still gated until this proposal is accepted and the substrate-field PRD lands.
- Keep the readiness-gate guardrails: no kernel widening; client never re-implements canonicalization; contract stays inside ADR-008 safe paths.

## Open sub-decisions for the architect

1. **Transport confirm:** gRPC-over-UDS (recommended) vs Cap'n Proto RPC vs a custom framed protocol.
2. **Storage engine** for the durable per-patient append-only log: a plain append-only file/WAL, or an embedded store (`redb`/`sled`/SQLite). (The append-only ledger maps most naturally to an append-only log.)
3. **Concurrency/consistency model:** per-patient single-writer serialization (recommended for an append-only ledger) vs broader transactional scope.
4. **Promotion:** accept this as `pi-ledger/docs/adr/009` (service + transport) and a `pi-chart` ADR 021 (client-adapter posture), or keep iterating here first.

## Out of scope (unchanged)

Implementing the service or the adapter; choosing backend/vector/OpenBrain/retrieval tech; hidden `pi-sim` coupling; agent autonomous accepted-writes. This proposal is **interface/architecture spec** per the "spec, don't implement at unstable boundaries" discipline — it crystallizes the decision so the substrate-field PRD and adapter lane can proceed against a known shape.
