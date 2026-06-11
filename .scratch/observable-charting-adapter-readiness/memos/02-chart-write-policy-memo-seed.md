# Chart-write policy memo seed

Status: readiness memo (not a `pi-chart` ADR)
Parent: `.scratch/observable-charting-adapter-readiness/PRD.md`

Do not promote to `pi-chart/docs/adr/` until post-rebase chart-write ownership is named.

## Draft flowsheet observations

Unvalidated staging records. Not chart truth. Must remain visibly unvalidated.

Minimum draft fields (resolve at implementation):

- patient/encounter mapping state
- metric name, value, unit, effective chart time
- selected source sample identity and source lane
- selection policy, tolerance, missing-value reason
- quality/warning flags
- adapter name, version, run id, replay offset
- review bundle links prepared by human or `pi-agent` assistant

## Clinician/user validation

Validated chart truth requires explicit human action recording:

- validator identity
- validation/attestation time
- effective chart time
- decision: `accepted_unchanged`, `corrected`, or `rejected`
- link back to draft/source telemetry provenance

`pi-agent` may summarize, flag gaps/outliers, match drafts to orders, and prepare review bundles. It must not validate, attest, override clinician corrections, infer future vitals, or read hidden `pi-sim` internals.

## Required `pi-chart` review before writes

Read before any chart-write implementation issue:

- `pi-chart/CONTEXT.md`
- `pi-chart/docs/adr/006-source-kind-taxonomy.md`
- `pi-chart/docs/adr/010-evidence-ref-roles.md`
- `pi-chart/docs/adr/011-transform-activity-provenance.md`
- `pi-chart/docs/adr/017-actor-attestation-review-taxonomy.md`

A new `pi-chart` ADR is allowed only if post-rebase vocabulary cannot represent draft observations and validation without ambiguity.