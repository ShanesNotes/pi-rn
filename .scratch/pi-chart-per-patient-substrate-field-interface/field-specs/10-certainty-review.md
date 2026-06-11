# Field spec 10 — certainty reconnection + review as separate facts

Status: completed
Issue: `issues/10-certainty-reconnection-and-review-attestation-as-separate-facts.md`
Posture: `revise`

## A. `certainty` reconnection

| Field | Axis | Drives |
| --- | --- | --- |
| `certainty` (enum) | epistemic modality | source-trust, `[inferred]` tags |
| graded certainty | clinical confidence | Concern / Uncertain / Working diagnosis / Resolved |

Deprecate `data.differential`/`data.uncertainty` as signal — fold into typed assessment object (Issue 04).

**Pi boundary:** may surface Concern/Uncertain; **never** upgrades to Working diagnosis.

## B. Review/attestation as separate facts

Each review is its own append-only fact (`id`, `actor`, `time`, `evidence`→target):

| Fact | Label |
| --- | --- |
| `review.reviewed` | Reviewed |
| `review.verified` | Verified |
| `attestation.signed` | Signed |
| `attestation.cosigned` | Co-signed |

Never mutate target. Review-state label = projection over review facts + freshness.

## Done vs Charted

- **Done** — view-level completion
- **Charted** — requires sanctioned chart source

Never collapsed.

## Scaling

N reviewers compose without write contention on target fact.