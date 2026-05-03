# Write-authority deferral gate

Status: docs-only gate drafted on 2026-05-03.
Related issue: `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/10-write-authority-deferral-gate.md`

## Purpose

This gate preserves the adapter-era rule that the first `pi-chart` ↔ `pi-ledger` adapter work is read/projection-oriented. In plain terms, direct agent accepted-writes require a later proposal/review policy and are not part of this adapter strategy's initial implementation path.

The current split remains:

- `pi-ledger` owns cryptographic kernel truth and accepted ledger mechanics.
- `pi-chart` owns chart workflows, adapters, projections, and clinician-facing review surfaces.
- `pi-agent` may later produce proposals or review artifacts through an approved policy, but it does not receive direct accepted append authority from this workstream.

## Allowed adapter behavior in this phase

Adapter issues in this workstream may be promoted only for behavior that stays inside the read/projection seam:

- **Read** deterministic `pi-ledger` fixture or kernel output through the selected boundary mechanism.
- **Translate** ledger claims into chart-visible clinical concepts without pushing chart schema semantics back into the kernel.
- **Project** ledger-backed facts into chart read models for workflow/UI consumption.
- **Validate** adapter inputs and boundary assumptions using deterministic tests or structural checks.
- **Produce deterministic errors** when ledger input, boundary input, or chart projection input is malformed or unsupported.

## Forbidden behavior in this phase

The adapter lane must not introduce any of the following without a later accepted PRD/ADR or explicitly promoted issue:

- Accepted append authority from `pi-agent`.
- Direct `pi-agent` writes into `pi-ledger` or chart truth.
- Runtime orchestrator accepted-write paths.
- Hidden simulator evidence or hidden `pi-sim` source as chart/ledger evidence.
- Current patient migration into the ledger.
- External EHR write-back, including FHIR write, SMART/CDS Hooks mutation, Medplum/HealthChain write paths, or openEHR commit semantics.
- Production storage, sync, service, auth, or deployment decisions.

## Future write policy is not blocked

This gate does not reject future write-capable workflows. It only prevents implicit adoption inside the read/projection adapter workstream.

A future write policy must name, at minimum:

1. Who or what may propose a chartable claim.
2. Who or what may accept that claim into clinical truth.
3. How clinician review, attestation, rejection, and correction are represented.
4. Which `pi-ledger` append interface is used and how accepted metadata stays store-owned.
5. How hidden simulator state and agent runtime traces remain outside accepted clinical evidence.
6. Which tests prove no direct agent accepted-write shortcut exists.

## Lightweight structural check

Future agents can run this from the repository root to confirm a docs-only adapter issue did not add product-source write authority:

```bash
git diff --name-only -- pi-chart/src pi-ledger/crates pi-agent pi-sim pi-chart/schemas pi-chart/patients
```

Expected output for this docs-only lane: no files attributable to the lane.

Future implementation issues can also run a targeted search when reviewing write authority:

```bash
git grep -nE "agentAppendClaim|accepted[ _-]?write|writeBack|write-back|orchestrator.*append|pi-agent.*append" -- pi-chart/src pi-ledger/crates pi-agent pi-sim
```

Matches are not automatically failures; each match must be justified by an accepted write-policy PRD/ADR or a promoted implementation issue. Without that authority, adapter work remains read/translate/project/validate only.
