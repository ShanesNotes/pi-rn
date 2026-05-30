# Adapter readiness gate

Status: docs-only gate drafted on 2026-05-03.
Related issue: `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/01-adapter-readiness-gate.md`

## Purpose

This gate prevents the `pi-chart` ↔ `pi-ledger` adapter lane from becoming implementation work before the reusable ledger kernel has stable evidence. It keeps the current split explicit:

- `pi-ledger` owns cryptographic kernel truth.
- `pi-chart` owns chart/EHR workflows, views, adapters, projections, and brownfield compatibility.
- adapter implementation issues stay `needs-triage` until a maintainer promotes them after reviewing kernel evidence.

## Promotion rule

Adapter implementation may be promoted only after all three conditions are true:

1. The `pi-ledger` K0-K12 kernel chain has completed with closeout evidence (the public interface is current as of K12 per `pi-ledger/docs/ledger-core-public-interface.md`), and the remaining pre-adapter blocker — kernel-deepening issue 07 (fixture-export quarantine) in `.scratch/pi-ledger-kernel-interface-deepening/issues/` — is closed.
2. The adapter workstream has a completed consumer-contract inventory and brownfield reconciliation note.
3. A maintainer has selected the first Rust/TypeScript integration mechanism through the HITL mechanism-decision issue.

Until then, adapter issues may be used for planning, inventory, and source-authority cleanup only.

## Required kernel evidence

| Kernel slice | Evidence required before adapter promotion |
| --- | --- |
| K0+K2 canonicalization/hash | Stable canonicalization identifier, `sha256:<64 lowercase hex>` record hash, property-order invariance, clinical-payload sensitivity, self-field exclusion, unsupported-input rejection, and id/hash separation. |
| K1 minimal Claim validation | Accepted four-shape claim vocabulary, required claim fields, valid-time ownership, correction-link minimum, unsupported revision rejection, and no chart `EventEnvelope` dependency. |
| K3 append-only ledger | Store-assigned `accepted_at`, monotonic `seq`, deterministic per-append `batch_id`, record hash, entry hash, previous-entry link, head validation, mutation detection, and deterministic reread/recompute. |
| K4 predicate registry minimum | Seeded predicate registry behavior, unknown predicate rejection, shape/object checks, no net-new dependencies unless triaged, and no import of chart event schema semantics. |
| K5 minimal bitemporal read | Point-read behavior that keeps valid time and known time distinct and does not leak later accepted corrections into earlier known-time views. |
| K6 synthetic fixture closeout | Deterministic synthetic fixture corpus, boundary checks, no current-patient migration, no hidden simulator coupling, and reusable golden evidence for adapter tests. |

> **Note (2026-05-29):** the kernel has since shipped through **K12** (predicate admission, base/correction admission, snapshot/rebuild, query projection) with a frozen, test-guarded public interface — see `pi-ledger/docs/ledger-core-public-interface.md`. The K0-K6 evidence table above is the original floor; adapter promotion now also requires kernel-deepening **issue 07 (fixture-export quarantine)** to close so adapters cannot mistake `ledger_core::fixture::*` for production API.

## Adapter workstream gates

| Adapter issue | Promotion meaning |
| --- | --- |
| 01 readiness gate | May be completed as docs-only immediately. It does not authorize product source work. |
| 02 kernel consumer contract inventory | Waits for K0-K12 so the inventory reflects real kernel interface evidence (and for kernel-deepening issue 07 fixture-export quarantine to close). |
| 03 brownfield reconciliation | May be completed as docs-only immediately. It must not delete or edit product source. |
| 04 integration mechanism decision | HITL; waits for kernel contract inventory. This chooses the first boundary mechanism but does not implement it. |
| 05-09 adapter executable proofs | Stay `needs-triage` until K0-K12, kernel-deepening issue 07 (fixture-export quarantine), issue 02, and issue 04 are complete. Promote one narrow slice at a time. |
| 10 write-authority deferral | May be docs-only after issue 01. It should block implicit direct-write adoption. |
| 11 archived package retargeting | Waits for issue 02 and issue 03. It should not create downstream implementation scope. |
| 12 source-authority closeout | Runs after the planning/executable proof lane has enough completed evidence to avoid stale authority. |

## Guardrails before implementation

- Do not edit `pi-chart/src/`, `pi-ledger/crates/`, schemas, patients, package archives, accepted ADRs, lockfiles, or runtime hidden simulator surfaces from adapter planning issues.
- Do not treat `pi-chart/src/claim-ledger/` as the canonical kernel home.
- Do not migrate current patient directories as part of the first adapter proof.
- Do not grant `pi-agent` direct accepted-write authority.
- Do not import or inspect hidden `pi-sim` internals.
- Do not merge external FHIR/openEHR/export planning with this internal chart-ledger adapter seam.
- Do not choose the Rust/TypeScript integration mechanism outside the HITL mechanism-decision issue.

## Closeout evidence for this gate

This note satisfies the readiness-gate issue by naming the exact required kernel evidence, preserving `needs-triage` status for implementation issues, separating internal adapter work from external export planning, and repeating the boundary guardrails.
