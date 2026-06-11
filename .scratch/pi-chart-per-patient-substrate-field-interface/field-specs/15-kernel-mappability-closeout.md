# Field spec 15 — kernel-mappability closeout + boundary register

Status: completed
Issue: `issues/15-kernel-mappability-closeout-and-boundary-register.md`
Posture: `open-question` (two prerequisites remain OPEN)

## Seven mappability prerequisites

| # | Prerequisite | Status |
| --- | --- | --- |
| 1 | `predicateId` + production `PredicateRegistry` | **OPEN** (Issue 03) |
| 2 | Explicit `factShape` 6→4 collapse | Decided (Issue 02) |
| 3 | Typed `object` per predicate | Decided (Issue 04) |
| 4 | Canonical UTC timestamps | Decided (Issue 05) |
| 5 | Record hash on correction targets | Decided (Issue 09) |
| 6 | Top-level `integrity` block | Decided (Issue 08) |
| 7 | Agreed canonicalization id | **OPEN** (Issue 08) |

Also explicit: `subject.patientId`; K3 never-emit set (`accepted_at`/`seq`/`batch_id`/hashes).

## No kernel widening

Chart bends to frozen K0–K12 Claim target. Chart-internal projections (authority, attention, timing, access tier, suggestion, certainty, source) stay view-side.

## Integration mechanism (accepted north star)

Shared clinical-truth service — contract-first, private gRPC/UDS, per-patient append-only WAL/log. pi-chart becomes client. Canonicalization runs once in Rust.

Source: `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`

## Deferrals (boundary register)

- Rust↔TS integration mechanism — decided as service client, not in-process FFI
- Production PredicateRegistry authoring
- Canonicalization id agreement
- Implementation of `eventMatchesEncounter` fix, vitals lift, adapter
- Retrieval technology for hot/warm/cold