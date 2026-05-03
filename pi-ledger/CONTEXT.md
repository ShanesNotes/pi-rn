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
- **Canonicalization**: deterministic JSON-compatible byte representation used for cryptographic hashes.
- **Canonical UTC timestamp**: kernel timestamp string in `YYYY-MM-DDTHH:MM:SSZ` form.
- **Record hash**: SHA-256 proof of canonical claim content; never the only claim identity.
- **Append ledger**: patient-scoped ordered record of accepted claims with sequence, accepted time, previous-entry hash, and head validation.
- **Valid time**: when the claim applies clinically.
- **Valid time expression**: Claim time expression that is exactly one canonical UTC instant or one canonical UTC interval with `start <= end`.
- **Recorded time**: Claim provenance timestamp for when the source actor or adapter says the Claim was recorded.
- **Known time**: when the ledger accepted the claim.
- **Adapter-local timestamp normalization**: conversion of source-system timestamps into **Canonical UTC timestamp** form before they enter the claim-ledger kernel.
- **Adapter**: concrete consumer-side integration layer, such as `pi-chart`, that translates ledger primitives into chart views/workflows.

## Invariants

- Stable claim identity uses both claim id and content hash.
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
