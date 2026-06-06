# Decision: clinical-truth service north star + adapter transport options (resolves issue 04 direction)

Status: **accepted north-star architecture** (human grill, 2026-05-31). The service shape is accepted, the concurrency/consistency model is accepted as **many clinical entry points, one patient-scoped service-side append order**, the access shape is accepted as **clinical entry points → app/backend → private internal clinical-truth service**, the first transport is accepted as **gRPC over Unix-domain socket behind a swappable contract**, and durable storage is accepted as **per-patient append-only WAL/log first**. ADR promotion is complete: see `pi-ledger/docs/adr/009-clinical-truth-service.md` and `pi-chart/docs/adr/021-clinical-truth-service-client-boundary.md`.
Decision owner: architect. Drafted from the re-entry audit + design pass (`.scratch/pi-rn-reentry-audit-28052026/AUDIT.md`).
Relates to: adapter `issues/04-integration-mechanism-decision.md`, `adapter-readiness-gate.md`, `pi-ledger/docs/ledger-core-public-interface.md` (ADR 008), `CONTEXT-MAP.md` seam matrix.

## Context

Issue 04 was framed narrowly as "pick the Rust↔TS integration mechanism." Two inputs reframe it into an architecture decision:

1. **Architect's runtime vision (2026-05-29):** the clinical memory is **one shared source of truth** that many agents/views/tools connect to — *not* a per-agent embedded copy. Speed and latency are first-class requirements: this is a real-time agent memory layer and clinical source of truth.
2. **Engineering analysis (design-pass F3 agent):** the kernel's public interface is **stateful** — `admission`/`point_read` take the same-patient *trusted entries* as input. A stateless per-call transport (spawn-per-call CLI, or wasm-as-pure-function) must either re-ship the whole patient ledger every call (O(history)) or evolve into "a long-lived stateful service with a wire protocol — at which point you have built a service." A second-language re-implementation (regen-in-TS) is rejected outright: it clones the canonicalization the kernel exists to own (ADR 020), creating two cryptographic sources of truth.

These converge: a **shared, stateful, low-latency clinical-truth service is the correct shape**, and it is what the architect independently chose.

## Decision (accepted north star; ADR-promoted)

**Grow `pi-ledger` from a library into a clinical-truth service**, and make `pi-chart` (and later `pi-agent`) **clients** of it.

1. **Service.** A long-lived Rust process wraps `ledger-core`, owns **durable per-patient append-only ledger storage** (append-only WAL/log first; embedded stores only if later access patterns require them), and exposes *only* the ADR-008 safe consumer paths (`canonical_json`, `record_hash`, typed `RecordHash`/`EntryHash`/`CanonicalTimestamp`, `validate_claim` → `AppendAdmissibleClaim`/`RevisionAdmissibleClaim` → `append_admissible`/`append_revision_admissible`, `point_read`, snapshot/`from_snapshot`). Canonicalization/hashing runs **once, in Rust** — single source of truth, native speed.

2. **Contract-first (the real deliverable).** The load-bearing artifact is a **versioned service contract**: a typed schema over the ADR-008 interface, plus the kernel's **golden vectors promoted to a transport-agnostic conformance suite** (ADR 001 names the golden vector "the portability contract"). This mirrors the proven `pi-sim` pattern (a versioned `.lanes.json` + fixtures as consumer regression evidence — *not* a spawned process). The contract must (a) model how trusted entries cross the boundary without the client mutating-then-trusting them, and (b) never widen beyond the documented safe paths ("no contract-by-imitation," per ADR 008).

3. **Transport: gRPC over a Unix-domain socket as the accepted first transport.** The protobuf schema *is* the versioned contract; typed end-to-end; local/private backend-to-service path; language-agnostic (Rust server, TS backend client via grpc-js, future internal consumers); supports server-streaming for agents subscribing to memory updates. Transport sits **behind** the contract and remains swappable. *Alternative only if profiling proves raw serialization latency dominates:* Cap'n Proto RPC (zero-copy) or a custom framed protocol.

4. **wasm as an optional client fast-path, not the mechanism.** A wasm build of just the *canonicalization* may be embedded in a client for local content-addressing/optimistic hashing without a round-trip — sharing the exact Rust bytes. Authority always remains the service.

5. **pi-chart stays TypeScript** as a fast client + projection/view layer; the heavy clinical-truth path is **Rust end-to-end** (service + kernel). This directly answers the "is this production-grade?" concern: the source-of-truth hot path is systems-grade Rust; TS hosts the clinician-facing views.

6. **Concurrency/consistency: many entry points, one patient-scoped append order.** Multiple clinicians, workflows, and agents may open Pi-RN from different entry points and submit work concurrently, but none of those entry points owns truth locally. For a given patient ledger, the service is the authoritative append/order path: it assigns `seq`/`accepted_at`/head, rechecks correction/review targets against current hashes, and publishes one ordered patient truth stream to all readers/subscribers.

7. **Access shape: entry points are mediated by the app/backend; truth service is private/internal.** Browser/EHR/task/specialty entry points talk to the normal Pi-RN/pi-chart app/backend surface, which owns auth/session/workflow mediation. The backend/service layer is the only component that talks to the clinical-truth service. The clinical-truth service is a private internal service, not a public/external clinical API. This keeps many clinical entry points compatible with one patient truth stream and keeps a local/private service transport such as gRPC over UDS plausible; browsers, EHR integrations, and external workflow entry points do not connect directly to the ledger service.

## Why not the alternatives (summary)

| Option | Verdict | Why |
|---|---|---|
| Spawn-per-call CLI | ✗ | ~5–50 ms/op spawn cost; must re-ship ledger state per call; invents a second text protocol beyond ADR-008; unavailable in browser/edge. |
| Embed in TS (native addon / wasm-as-everything) | ✗ as primary | Per-process copy contradicts "one shared source of truth"; native addon adds a per-platform binary matrix; wasm is awkward as the *durable store*. Good only as a client fast-path (#4). |
| Regenerate kernel in TS | ✗ | Two cryptographic implementations to keep in lockstep — the exact duplication ADR 020 removed. |
| **Shared Rust truth service (this proposal)** | ✓ | Single canonicalization source; shared, durable, concurrent; low-latency local IPC; contract-first; language-agnostic; production-clinical shape. |

## Implications / what changes

- Reshapes adapter **issue 04**: the accepted mechanism is *client-of-a-truth-service over a versioned contract*; the accepted first transport is private/local gRPC over UDS, kept swappable behind the contract.
- New pi-ledger component: a **service crate** + a **durable storage layer** (the in-memory `AppendLedger` gains an append-only on-disk backing). This is net-new and is the largest build item.
- pi-chart adapter (adapter issues 05–09) becomes a **service client + projection mapping** against the conformance suite over private/local gRPC/UDS — now gated on the substrate-field PRD and implementation planning.
- Keep the readiness-gate guardrails: no kernel widening; client never re-implements canonicalization; contract stays inside ADR-008 safe paths.

## Settled sub-decisions

- **Concurrency/consistency:** many clinical entry points and concurrent submitters are allowed, but each patient ledger has one authoritative service-side append order. This is a service ordering guarantee, not a limit of one clinician, one UI, or one workspace.
- **Access/exposure shape:** clinical entry points talk to the Pi-RN/pi-chart app/backend; only the backend/service layer talks to the clinical-truth service. The service is private/internal, not a public/external clinical API. This is an architecture boundary, not a full auth/role/access-plane implementation.
- **Transport:** private/local gRPC over Unix-domain socket is the first transport. The contract remains transport-swappable; Cap'n Proto/custom protocols are reserved for a later profiling-driven optimization.
- **Storage:** per-patient append-only WAL/log is the first durable storage posture. Embedded stores (`redb`/`sled`/SQLite) are reserved for later if indexing, compaction, or operational needs justify them behind the same service contract.

## Out of scope (unchanged)

Implementing the service or the adapter; choosing backend framework/vector/OpenBrain/retrieval tech or full auth/access-plane policy; implementing durable storage; hidden `pi-sim` coupling; agent autonomous accepted-writes. This proposal is **interface/architecture spec** per the "spec, don't implement at unstable boundaries" discipline — it crystallizes the decision so the substrate-field PRD and adapter lane can proceed against a known shape.
