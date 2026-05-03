# PRD: pi-chart ↔ pi-ledger adapter strategy

Status: needs-triage
Program status: planning-only adapter strategy workstream; not implementation-ready until the `pi-ledger` kernel slices land green and this workstream is triaged.

## Problem Statement

The project has made a major architecture decision: `pi-ledger` owns the reusable cryptographic claim-ledger kernel, while `pi-chart` remains the chart/EHR truth subsystem that owns clinical workflows, views, adapters, and brownfield compatibility. That decision gives the kernel a cleaner architectural home, but it creates a new integration problem: future agents need a precise adapter strategy so `pi-chart` can consume `pi-ledger` without re-coupling the kernel to chart prototypes, hidden simulator internals, current patient fixture layout, or premature runtime/export assumptions.

From the maintainer's perspective, the risk is not that integration is impossible; the risk is that AFK agents will bridge the projects in the easiest local way and accidentally undo the clean-slate decision. The adapter strategy must describe the consumer boundary, readiness gates, first useful integration slices, brownfield reconciliation, test shape, and future package implications before any source implementation begins.

## Solution

Create a planning-only PRD for the `pi-chart` ↔ `pi-ledger` adapter boundary. The strategy keeps `pi-ledger` as the cryptographic kernel authority and treats `pi-chart` as a consumer that translates ledger primitives into chart-visible workflows and projections. The first adapter work should be narrow, behavior-tested, and reversible: prove that chart code can consume stable ledger identities and deterministic ledger fixtures before any patient migration, runtime write path, broad chart rewrite, FHIR/openEHR export, or agent-accepted clinical write path.

The adapter should eventually be built as a small set of deep modules with simple interfaces:

- a ledger boundary/client facade that hides the cross-language and packaging mechanics from chart workflows;
- a claim translation layer that maps ledger claims and ledger acceptance metadata into chart-visible clinical concepts without pushing chart schemas back into the kernel;
- a chart projection layer that derives read models from ledger-backed claims for UI/workflow consumption;
- a brownfield reconciliation lane that classifies existing chart-local claim-ledger prototype code as archive, golden-vector evidence, or deletion candidate;
- a fixture and compatibility harness that proves the adapter consumes `pi-ledger` golden vectors without current patient fixture migration or hidden simulator coupling.

This PRD enters the local issue tracker as `needs-triage`. It should be converted to issues only after the currently active `pi-ledger` K0+K2 canonicalization/hash slice lands green enough to provide real interface evidence.

## User Stories

1. As a maintainer, I want a dedicated adapter strategy PRD, so that the `pi-ledger` decision has an explicit path back into `pi-chart`.
2. As a maintainer, I want the PRD to stay `needs-triage`, so that no AFK agent treats adapter implementation as ready before the kernel interface exists.
3. As a future `pi-chart` agent, I want to know that `pi-ledger` owns cryptographic canonicalization and hashing, so that I do not reimplement kernel truth under chart source.
4. As a future `pi-ledger` agent, I want chart-specific schemas and patient fixture layout kept outside the kernel, so that the reusable ledger remains clean.
5. As a chart workflow author, I want a stable adapter boundary, so that chart UI and clinical review flows do not depend on Rust crate internals.
6. As a future binding author, I want cross-language mechanics hidden behind a small facade, so that TypeScript/Rust packaging changes do not cascade through chart workflows.
7. As a clinical-memory architect, I want ledger claim ids and content hashes preserved through the adapter, so that chart references remain tamper-evident.
8. As a clinical-safety reviewer, I want valid time and known time preserved through chart projections, so that backdated corrections do not leak future knowledge into earlier chart views.
9. As a clinician-facing chart user, I want chart views to keep clinical semantics clear, so that cryptographic ledger metadata does not obscure clinical meaning.
10. As a reviewer, I want the first adapter slice to be read/projection-oriented, so that integration can prove compatibility before write authority is introduced.
11. As a maintainer, I want brownfield `EventEnvelope` compatibility treated as an adapter concern, so that it does not define ledger internals.
12. As a maintainer, I want existing chart-local claim-ledger prototype code reconciled explicitly, so that duplicate implementations do not survive by accident.
13. As a future migration author, I want current patient directories excluded from the first adapter phase, so that migration design waits for stable ledger behavior.
14. As a test author, I want deterministic ledger fixtures consumed by chart tests, so that the adapter proves behavior without hidden simulator or patient-fixture leakage.
15. As a simulator-boundary reviewer, I want hidden `pi-sim` internals forbidden from adapter evidence, so that no oracle state enters chart truth.
16. As an agent-runtime planner, I want direct agent accepted-writes deferred, so that proposal/review policy can be decided before agents mutate clinical truth.
17. As a future access-plane planner, I want the adapter to expose id/hash/sequence/accepted-time references cleanly, so that tool authorization can cite stable ledger facts later.
18. As a future ContextPacket planner, I want adapter output to be compatible with bounded chart packets, so that downstream packets do not depend on chart filesystem layout.
19. As a future orchestrator planner, I want append and read semantics to come from the kernel, so that runtime orchestration does not create a second truth store.
20. As a package-archive reviewer, I want archived package assumptions retargeted from chart-local ledger code to `pi-ledger` primitives, so that useful research survives without reviving obsolete ownership.
21. As a code reviewer, I want no adapter module layout accepted in this PRD, so that implementation paths can be chosen after kernel evidence and issue triage.
22. As a release planner, I want explicit readiness gates, so that adapter work does not start before K0-K6 behavior is proven.
23. As an AFK agent, I want the future issues to be independently grabbable, so that each slice can be developed without rereading the whole architecture debate.
24. As a maintainer, I want the adapter strategy separated from FHIR/openEHR export planning, so that external EHR boundary work does not pollute the internal chart-ledger seam.
25. As a future documentation agent, I want `pi-chart` and `pi-ledger` context docs to stay aligned, so that later agents see the same ownership boundary in both places.
26. As a verification agent, I want adapter tests to check observable behavior rather than private helper structure, so that implementation can evolve without invalidating tests.
27. As a clinical-safety reviewer, I want append-only correction semantics preserved in chart projections, so that corrections never appear as destructive mutation.
28. As a maintainer, I want adapter errors to remain deterministic and explainable, so that invalid ledger data cannot silently become chart truth.
29. As a future UI author, I want chart-friendly read models over ledger-backed facts, so that clinical workflows are not forced to display raw ledger entries.
30. As a future cleanup agent, I want a planned archive/delete path for superseded chart-local ledger work, so that the codebase does not carry two competing ledger kernels.

## Implementation Decisions

- `pi-ledger` remains the sole owner of canonicalization, record hashing, append order, ledger integrity, predicate validation hooks, and minimal bitemporal read semantics.
- `pi-chart` remains the owner of chart/EHR workflows, clinical views, clinician review surfaces, brownfield compatibility, chart-side adapters, and any future migration or projection logic.
- The adapter strategy is internal cross-subproject integration. It is not the same as external FHIR/openEHR export planning.
- The adapter workstream should not begin source implementation until the relevant `pi-ledger` kernel slices provide stable interface evidence and this PRD has been converted into triaged issues.
- The first adapter milestone should be compatibility/projection proof, not broad migration or direct write authority.
- The first useful adapter behavior should consume deterministic ledger fixtures and golden vectors, preserve ledger id/hash identity, and produce chart-visible read/projection output.
- A later write-capable adapter may translate chart workflow intent into ledger append requests, but direct agent-accepted clinical writes remain deferred until proposal/review policy exists.
- Brownfield chart event compatibility is a consumer-side translation problem. It must not force `EventEnvelope`, patient directory layout, UI prototypes, or chart schemas into `pi-ledger` internals.
- Existing chart-local claim-ledger prototype work should be reconciled after `pi-ledger` K0 lands: either archive as lineage, reuse as golden-vector evidence, or remove once superseded.
- The cross-language packaging mechanism is intentionally not selected here. Library binding, command boundary, generated fixture exchange, or WebAssembly can be evaluated after the kernel public interface exists.
- The adapter should be organized around deep modules with small stable interfaces: ledger boundary facade, claim translator, chart projection/read model, fixture compatibility harness, and brownfield reconciliation lane.
- Archived research packages remain evidence only. Any package-derived assumption that previously targeted chart-local kernel files must be retargeted to `pi-ledger` primitives or rejected during triage.
- Hidden simulator state, `pi-sim` source internals, runtime transcripts, model traces, and non-chart oracle data are forbidden adapter inputs.
- Current patient migration, production backend selection, external EHR representation, and access-plane/runtime/orchestrator integration remain downstream work.

## Testing Decisions

- Good adapter tests should verify externally visible behavior at the chart-ledger seam: stable id/hash preservation, deterministic projections, bitemporal behavior, append-only correction visibility, and deterministic error handling.
- Tests should avoid private implementation details, helper layout, or cross-language packaging mechanics unless the specific issue owns that packaging contract.
- The ledger boundary facade should be tested with deterministic kernel fixtures or golden vectors, not current patient directories.
- The claim translation layer should be tested for preservation of clinical identity, provenance, accepted metadata, valid time, known time, and correction links.
- The chart projection layer should be tested from ledger-backed inputs to chart-visible read models, not from internal ledger storage details.
- Brownfield reconciliation should be tested structurally: no duplicate active kernel remains in chart code, and any retained prototype evidence is explicitly documented as lineage or fixture evidence.
- Boundary tests should fail if adapter work imports hidden simulator internals, depends on chart patient fixture layout as authority, or treats external FHIR/openEHR shapes as internal chart-ledger identity.
- Prior art includes the existing adapter-boundary planning checks, the active `pi-ledger` kernel test spec, and chart validation/rebuild tests that verify observable chart behavior rather than internal helper structure.

## Out of Scope

- Implementing adapter source files, public APIs, bindings, command-line protocols, WebAssembly packaging, or generated schemas.
- Choosing the final cross-language integration mechanism between Rust and TypeScript.
- Migrating current chart patient directories into the ledger.
- Retrofitting every brownfield `EventEnvelope` user.
- Reopening the decision that `pi-ledger` owns the cryptographic claim-ledger kernel.
- Changing `pi-ledger` K0-K6 issue scope while the kernel agent is in flight.
- Implementing FHIR, openEHR, SMART, CDS Hooks, Medplum, HealthChain, external EHR export, legal export, or regulator packets.
- Granting `pi-agent` direct accepted-write authority.
- Reading hidden `pi-sim` internals or treating simulator oracle state as clinical evidence.
- Selecting a production database, service topology, sync engine, or deployment model.

## Further Notes

This PRD is the bridge between the accepted `pi-ledger` ownership decision and future `pi-chart` integration. It should remain planning-only until at least the first `pi-ledger` kernel slice produces stable canonicalization/hash evidence. The likely next Pocock flow is `$to-issues` after K0 lands, with slices optimized for AFK development: adapter readiness gate, brownfield reconciliation, fixture/golden-vector compatibility, read/projection adapter, write-policy deferral, and source-authority closeout.

This PRD narrows and complements the older adapter-boundary future-work planning. That older lane is mostly about external chart export boundaries such as FHIR/openEHR; this PRD is about the internal chart-to-ledger seam created by moving the cryptographic kernel into `pi-ledger`.
