# Field spec 02 — `factShape` and the 6→4 collapse

Status: completed
Issue: `issues/02-fact-shape-and-the-six-to-four-collapse.md`
Posture: `revise`

## Field

| Attribute | Value |
| --- | --- |
| `factShape` | `"context" \| "observation" \| "interpretation" \| "act"` — required on every charted-clinical-fact |
| Kernel target | `Claim.shape` — `ShapeMismatch` if `!= PredicateDefinition.shape` |

`type` (9-member `EventType`) survives as fixture/export authoring axis only; `factShape` is the contract value.

## Collapse table (authoritative)

| Source `type` | → `factShape` |
| --- | --- |
| `observation` | `observation` |
| `assessment` | `interpretation` |
| `intent` | `act` |
| `action` | `act` |
| `communication` | `act` (orderable) / `context` (narrative) — see Resolution A |
| `artifact_ref` | **no shape** — evidence only (Resolution B) |
| `subject` / `encounter` / `constraint_set` | `context` |

### Resolution A — `communication`

| Subtype class | Shape |
| --- | --- |
| `verbal_order`, `telephone_order`, `readback`, `co_sign` | `act` |
| narrative notes, handoffs, reports-as-context | `context` |
| unknown/missing subtype | `context` (safe default) |

Discrete findings in reports → separate `observation` facts with evidence links.

### Resolution B — `artifact_ref`

No Claim. Resolves to `EvidenceRef` on supporting facts. Report visuals are evidence, not substrate.

### `observation.context_segment`

`factShape=observation`, predicate `observation.context_segment` (not `context.segment`).

## Kernel rules

- Kernel not widened — chart bends to four shapes
- `artifact_ref` has no `predicateId` or Claim
- First link in `type → shape → predicate → object` chain (Issues 03/04 depend on this)

## Scaling

`factShape` is shardable category coordinate for `(patientId, factShape)` routing. Collapse is subtype-driven, not actor-driven.