# Field spec 03 — `predicateId` projection + production registry prerequisite

Status: completed
Issue: `issues/03-predicate-id-projection-and-production-registry.md`
Posture: `revise`

## Field

| Attribute | Value |
| --- | --- |
| `predicateId` | registered dotted id (e.g. `vital.sign`) — required on every Claim-producing fact |
| Kernel target | `predicate` — must be registered; `shape` must equal `factShape` |

`subtype` survives as chart-internal sub-axis; `predicateId` replaces it as load-bearing category gate.

## Production `PredicateRegistry` prerequisite

Kernel `phase1_registry` is fixtures-only. pi-chart must author a production registry matching this table before adapter work.

## Projection table (selected rows — full table in issue file)

| `type` | `subtype` | → `predicateId` | `shape` |
| --- | --- | --- | --- |
| `observation` | `vital_sign` | `vital.sign` | observation |
| `observation` | `lab_result` | `lab.result` | observation |
| `observation` | `context_segment` | `observation.context_segment` | observation |
| `assessment` | `problem` | `assessment.problem` | interpretation |
| `intent` | `order` | `order.request` | act |
| `action` | `medication_administration` | `act.medication_administration` | act |
| `communication` | `verbal_order` | `order.verbal` | act |
| `communication` | `sbar` / `handoff` / `*_note` | `comm.note` | context |
| `subject` | * | `context.patient` | context |
| `encounter` | * | `context.encounter` | context |
| `constraint_set` | `allergy` | `constraint.allergy` | context |
| `artifact_ref` | * | **none** (evidence) | n/a |

Review/attestation predicates: `review.reviewed`, `review.verified`, `attestation.signed`, `attestation.cosigned`, `attestation.readback` — all `act`.

## Determinism rules

- Unknown `(type, subtype)` → `*.generic` catch-alls per shape
- `predicateId` deterministic from `(type, subtype)` — no view inference

## Out of scope

Building the production registry (prerequisite only).