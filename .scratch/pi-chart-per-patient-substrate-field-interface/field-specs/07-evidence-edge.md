# Field spec 07 — unified evidence edge + dead-field closure

Status: completed
Issue: `issues/07-unified-evidence-edge-and-dead-field-closure.md`
Posture: `revise`

## One evidence edge

`evidence: EvidenceRef[]` across all three shapes.

| Shape | Today | Contract |
| --- | --- | --- |
| EventEnvelope | `links.supports` | `evidence: EvidenceRef[]` |
| NoteFrontmatter | `references: string[]` | converged to `EvidenceRef` |
| VitalSample | none | gains `evidence` |

`NoteFrontmatter.references` survives in export only (Issue 13).

## EvidenceRef fields

`ref`, `kind`, optional `role`, `basis`, `selection`, `derived_from` — with consumed-or-deferred register per kind/role (see issue §C).

## Lineage fields

| Field | Disposition |
| --- | --- |
| `transform.input_refs` | **consumed** (Source trail) |
| `links.supports` | consumed → `evidence` |
| `links.supersedes/corrects/fulfills/addresses/contradicts` | consumed (Issues 09/11) |
| `links.resolves` | revise — proposed consumer for `Resolved` (Issue 09) |
| `derived_from`, `selection` | deferred with named future home |

## Kernel mapping

Evidence has **no kernel field**. Affects Record hash when in canonical body. No kernel widening.