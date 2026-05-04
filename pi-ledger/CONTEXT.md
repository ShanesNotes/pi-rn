# pi-ledger Context

`pi-ledger` is the reusable cryptographic claim-ledger kernel for the `pi-rn` workspace.

## Domain role

- Owns canonical claim identity, deterministic canonicalization, content hashes, append-only ledger order, ledger integrity validation, and minimal bitemporal point reads.
- Provides a small kernel interface for chart/EHR substrates and future agent/access/runtime/orchestrator surfaces.
- Stays independent of `pi-chart` UI, brownfield `EventEnvelope`, patient fixture layout, generated cockpit artifacts, and hidden `pi-sim` internals.

## Core language

- **Claim ledger kernel**: reusable substrate for tamper-evident clinical claims, not a chart UI or EHR clone.
- **Claim**: minimal clinical fact/action/context/interpretion record with stable id, predicate, subject, object, time, actor/provenance, and integrity fields.
- **Ledger-acceptable Claim**: a Claim that satisfies the kernel's structural rules and is canonicalizable under the active canonicalization; a validated Claim must be hashable.
- **Validated Claim**: Ledger-acceptable Claim view that is the kernel authority for extracting Claim fields after structural and canonicalizability checks pass.
- **Append-admissible Claim**: Validated Claim that is eligible to enter a specific patient-scoped ledger after patient-scope and predicate-registry checks pass.
- **Revision-admissible Claim**: Append-admissible correction Claim whose revision target matches an already accepted entry in the same patient ledger by Claim id and Record hash.
- **Append admission**: explicit kernel decision step that proves a Validated Claim is eligible for a patient ledger before the Append ledger assigns known-time metadata and hashes a new entry.
- **Revision admission**: explicit kernel decision step that proves an Append-admissible correction Claim targets existing ledger content before append.
- **Admission module**: kernel seam that combines Validated Claim, patient-ledger scope, Predicate registry policy, and correction-target existence without making Append ledger, Predicate registry, or Query own those admission decisions.
- **Canonicalization**: deterministic JSON-compatible byte representation used for cryptographic hashes.
- **Canonical UTC timestamp**: kernel timestamp string in `YYYY-MM-DDTHH:MM:SSZ` form.
- **Record hash**: SHA-256 proof of canonical claim content; never the only claim identity.
- **Entry hash**: SHA-256 proof of a ledger entry envelope, including accepted metadata, previous-entry link, record kind/version, record content, and Record hash; used for append-chain integrity and head validation, not as Claim identity.
- **Append ledger**: patient-scoped ordered record of accepted claims with sequence, accepted time, previous-entry hash, and head validation.
- **Valid time**: when the claim applies clinically.
- **Valid time expression**: Claim time expression that is exactly one canonical UTC instant or one canonical UTC interval with `start <= end`.
- **Recorded time**: Claim provenance timestamp for when the source actor or adapter says the Claim was recorded.
- **Known time**: when the ledger accepted the claim.
- **Adapter-local timestamp normalization**: conversion of source-system timestamps into **Canonical UTC timestamp** form before they enter the claim-ledger kernel.
- **Adapter**: concrete consumer-side integration layer, such as `pi-chart`, that translates ledger primitives into chart views/workflows.

## Invariants

- Stable claim identity uses both claim id and content hash.
- Claim field extraction should go through **Validated Claim** accessors after validation; modules should not independently reinterpret Claim JSON for id, predicate, subject, time, or revision links.
- Append admission is stricter than Claim validation: accepted ledger entries must come from **Append-admissible Claims**, while accepted time, sequence, and batch identity remain store authority.
- Append-admission success should be represented as a value that can be passed to append-time APIs, not only as a boolean side check.
- Append APIs should make admission policy hard to bypass: appending an **Append-admissible Claim** is the preferred path for base Claims, appending a **Revision-admissible Claim** is the preferred path for correction Claims, and any lower-level append seam must be explicitly named as not enforcing the omitted admission checks.
- Append admission consumes a **Validated Claim**; raw JSON convenience validation-and-admission helpers are deferred until an adapter proves the need.
- Append admission depends on the target ledger patient id, not on Append ledger internals such as head, entries, or store clock.
- Predicate-registry policy belongs at the append-admission seam; the Append ledger owns patient-local ordering, store metadata, record hashes, entry hashes, previous-entry links, and head validation.
- Admission module owns the Append-admissible Claim value and admission errors; Ledger, Claim, and Predicate modules keep their narrower authority.
- Admission errors should preserve narrower module ownership by wrapping predicate failures and owning patient-scope mismatch, rather than flattening all validation failures into Ledger errors.
- Snapshot re-read validation remains a chain-integrity check; predicate-admission re-audit against a registry is separate and deferred until predicate registry versioning exists.
- Revision admission is stricter than Append admission for correction Claims: a correction must target an already accepted entry in the same patient ledger by Claim id and Record hash before it can append.
- Base Claims require Append admission but not Revision admission; correction Claims require Revision admission before normal append.
- Append admission alone remains the normal path for non-revision Claims and should not silently append Claims that carry a revision target.
- Revision admission belongs in the **Admission module** for K11 because it is still append eligibility, not a general correction graph engine.
- Revision admission proves target identity by validating the target entry record as a Ledger-acceptable Claim, parsing and recomputing its Record hash, then matching the correction target by Claim id plus Record hash.
- Revision admission does not own whole-chain/head validation; it assumes target entries come from the current ledger/snapshot surface supplied by the caller.
- Revision admission proves correction target existence only; conflict policy, replacement policy, clinical visibility requirements, and graph-wide correction semantics remain separate.
- Lower-level test/trusted-entry bypasses may exist only with loud names that state omitted predicate and/or revision admission checks, and normal fixtures/examples should not teach those bypasses.
- The deterministic fixture is a happy-path kernel example: base Claims should append through Append admission, and correction Claims should append through Revision admission against current ledger entries.
- Query remains a trusted-entry projection and should not become the owner of revision-target admission; query tests may use loud bypass helpers only to construct point-read fixtures or corrupt snapshots.
- K11 should land as one vertical issue because Revision admission, normal correction append API, fixture happy path, and bypass inventory must change together to avoid an unsafe intermediate append surface.
- Record hash and Entry hash are distinct identity values: correction links target claim id plus Record hash, while append-chain links and ledger head validation use Entry hash.
- Kernel hash strings use `sha256:<64 lowercase hex>` form, and hash parsing/formatting should be owned by a shared kernel hash rule rather than duplicated in Claim, Ledger, or Query code.
- Canonicalization and hash output must be deterministic across implementations.
- Append-only clinical truth: correction creates a new claim and does not erase the prior claim.
- Store-assigned accepted time, sequence, and batch identity are not caller authority.
- Valid time and known time remain distinct.
- **Recorded time** is not ledger **Known time**; only store-assigned accepted time controls known-time visibility.
- A Claim has exactly one **Valid time expression**.
- Ledger-acceptable Claims and store-assigned known times use **Canonical UTC timestamp** form so valid time and known time can be compared deterministically without adapter-local normalization.
- Timezone and offset interpretation stay outside `pi-ledger`; adapters normalize timestamps before kernel entry.
- Patient identity is explicit; no cross-patient ledger mixing.
- Hidden simulator/oracle state is never ledger evidence.
- FHIR, openEHR, UI models, runtime transcripts, and chart-specific layouts are boundary adapters, not internal ledger identity.

## Boundary with pi-chart

`pi-chart` consumes `pi-ledger` through explicit adapters. `pi-chart` owns chart views, clinical workflows, draft/review UI, and any brownfield compatibility bridge. `pi-ledger` owns the cryptographic claim-ledger kernel and should not import `pi-chart` source, schemas, patient directories, or prototype artifacts.

## Boundary with pi-sim and pi-agent

`pi-ledger` must not inspect hidden `pi-sim` internals. Observable telemetry may become ledger-backed chart truth only through explicit adapters and clinical/chart validation. `pi-agent` may later read bounded ledger/chart surfaces but must not write accepted clinical truth directly without proposal/review policy from later ADRs.

## ADR authority

Durable `pi-ledger` decisions live in `pi-ledger/docs/adr/`. Cross-subproject decisions that supersede `pi-chart` behavior should also be linked from `pi-chart/docs/adr/` or the root context map.
