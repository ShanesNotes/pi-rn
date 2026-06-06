# Implementation-ready plan after ultragoal re-entry

Date: 2026-05-31
Branch: `reentry-substrate-field-spec`
Ultragoal story: `G004-produce-implementation-ready-plan`

## Current decision state

The original long-running ultragoal was resumed from `.omx/ultragoal/goals.json` and `.omx/ultragoal/ledger.jsonl`.

Completed:

- `G001-reconcile-handoff-and-baseline` completed with passing baseline checks:
  - `pi-chart npm run typecheck`
  - `pi-chart npm test` — 30/30
  - `pi-ledger cargo test` — 128/128
- Re-entry audit artifact exists at `.scratch/pi-rn-reentry-audit-28052026/ULTRAGOAL-CURRENT-STATE.md`.

Resolved after this plan was first written:

- `G002-resolve-field-spec-decisions-with-gr` and `G003-resolve-truth-service-decisions-with` originally failed because `grill-with-docs --auto` required an unavailable Claude validator. That tooling blocker is now historical.
- The user explicitly pivoted to a human `grill-with-docs` session and approved decisions D001-D012 in `.scratch/pi-rn-reentry-audit-28052026/GRILL-WITH-DOCS-HUMAN-DECISIONS.md`.
- The durable ultragoal ledger now checkpoints G002/G003 complete against that human-grill evidence.

Therefore this plan remains a conservative sequencing artifact, but it no longer treats the old Claude-validator blocker as an active decision blocker.

## Boundary guardrails

- Do not implement the `pi-chart` to `pi-ledger` seam until a versioned service contract, registry ownership, canonicalization/hash acquisition path, and conformance tests are specified.
- ADR promotion is complete: `pi-ledger/docs/adr/009-clinical-truth-service.md` and `pi-chart/docs/adr/021-clinical-truth-service-client-boundary.md` record the accepted private/internal clinical-truth-service north star.
- Do not widen the `pi-ledger` Claim target. The chart bends to the frozen kernel interface.
- Do not touch hidden `pi-sim` or couple `pi-agent` directly to `pi-sim`.
- Leave pre-existing untracked design/presentation assets untouched unless a separate goal decides commit vs ignore.

## Issue readiness matrix

| Issue | State | Implementation posture |
|---|---|---|
| 01 identity/scope | `ready-for-agent`, with open cross-encounter declaration and `VitalSample.id` questions | Spec/doc cleanup only. No source/schema edits until field name and vital identity are settled. |
| 02 factShape collapse | decision-resolved in human grill (`D001`, `D003`) | `context_segment` uses `factShape=observation` with `predicateId=observation.context_segment`; review/attestation facts use `factShape=act`. No source/runtime implementation in this ultragoal; future work still waits on the shared contract gates. |
| 03 predicateId registry | mostly decision-resolved; OQ-4 remains | Report/note authority, `context_segment`, and review/attestation predicate ids are resolved. Remaining gate is production `PredicateRegistry` ownership/loading across the service-adapter contract; no production registry implementation in this ultragoal. |
| 04 typed object | target-link object home resolved; object-policy details remain | `attests_to`/`reviewed_refs` converge on `evidence: EvidenceRef[]`, not object fields. Remaining object-policy questions are `status_detail` typing, coding-system policy, and `differential` element shape; no source/runtime object registry implementation in this ultragoal. |
| 05 bitemporal time | `ready-for-agent` | Spec/doc cleanup only. Canonical UTC normalization implementation waits for adapter/service path. |
| 06 provenance vocabulary | `ready-for-human` | Vocabulary decision still human/architect-facing. No code. |
| 07 EvidenceRef edge | `ready-for-human` | Minor transform schema/citation cleanup is safe. No graph/runtime implementation. |
| 08 integrity/canonicalization id | `ready-for-human` | Blocked by canonicalization agreement mechanism. No TS canonicalization resurrection. |
| 09 lifecycle/correction hash | `ready-for-human` | Minor review-shape pointer cleanup is safe. Correction Record-hash implementation waits for hash acquisition path. |
| 10 certainty/review facts | partially decision-resolved in human grill (`D002`-`D005`) | Report/note authority, review/attestation `act` shape, predicate ids, and evidence-edge target linkage are resolved. Remaining certainty/co-sign-depth details stay planning concerns; no source/runtime implementation in this ultragoal. |
| 11 projection-facing fields | `ready-for-agent` | Doc/spec cleanup only. Projection code waits for upstream field decisions. |
| 12 suggestion state | `ready-for-agent` | Minor evidence-edge naming cleanup is safe. No kernel append path for suggestions. |
| 13 export round-trip | `ready-for-agent` | Minor owner-pointer cleanup is safe. Round-trip fixtures wait for identity/time/integrity gaps. |
| 14 clinician surface derivation | `ready-for-agent` | Doc/spec cleanup only. No UI truth-authority changes. |
| 15 kernel mappability closeout | service decision-resolved in human grill (`D006`-`D012`) | Clinical-truth-service acceptance and ADR promotion are complete. Adapter/seam implementation remains gated on production registry ownership, canonicalization/hash acquisition, versioned service contract, and conformance vectors. |

## Sequenced work

### Phase 0 — already done baseline

Use `ULTRAGOAL-CURRENT-STATE.md` as the baseline. Do not repeat full baseline unless source files change.

### Phase 1 — safe local spec cleanup

This was the only implementation slice originally safe before the human-grill decisions were accepted; it remains a safe docs/spec cleanup slice. It is documentation/spec cleanup inside `.scratch/pi-chart-per-patient-substrate-field-interface/issues/`:

1. Issue 12: replace stale promotion linkage wording that still names `links.supports` with the unified `evidence: EvidenceRef[]` edge; retain `links.addresses` only as a relationship/lifecycle edge if referenced.
2. Issue 07: either restate the full `transform{activity, tool, version?, run_id?, input_refs?}` block or explicitly cite PRD §2.E as the owner while Issue 07 owns `transform.input_refs` consumption.
3. Issue 13: point `VitalSample.quality` ownership to Issue 04, not Issue 07.
4. Issue 04: cross-reference Issue 01 for the unresolved cross-encounter declaration field name/shape.
5. Issue 02: add a cross-reference to the review/attestation shape seam owned with Issues 03/10 so Issue 02's generic `act` assumption is not silently authoritative.
6. Issue 09: add a one-line shared review-axis seam pointer for co-sign/attestation modeling owned with Issues 03/04/10, without renumbering Issue 09's correction-hash OQs.

Expected verification for Phase 1:

- `git diff -- .scratch/pi-chart-per-patient-substrate-field-interface/issues/`
- targeted grep checks for stale owner/edge wording:
  - `grep -R "links.supports" .scratch/pi-chart-per-patient-substrate-field-interface/issues/12-*`
  - `grep -R "quality.*Issue 07\|Issue 07.*quality" .scratch/pi-chart-per-patient-substrate-field-interface/issues/13-*`
  - `grep -R "transform" .scratch/pi-chart-per-patient-substrate-field-interface/issues/07-*`
- No app/runtime tests are required for docs-only cleanup; if code changes occur unexpectedly, rerun `pi-chart` typecheck/tests and `pi-ledger cargo test`.

### Phase 2 — accepted human-grill decision gate

The auto-validator path remains unavailable, but the user explicitly replaced it with a human `grill-with-docs` session. Decisions D001-D012 are recorded in `GRILL-WITH-DOCS-HUMAN-DECISIONS.md` and promoted into ADR 009/021 where relevant.

Remaining implementation gates are not the old auto-validator gate; they are concrete contract gates: production `PredicateRegistry` ownership, canonicalization/hash acquisition agreement, versioned service transport contract, and conformance vectors.

### Phase 3 — post-decision implementation planning

After the accepted human-grill decisions:

1. Author/update a concrete PRD/test-spec for the accepted field contract.
2. Sequence pi-chart-internal tests before seam tests:
   - fixture/export round-trip for EventEnvelope/NDJSON/Markdown;
   - projection derivation from fact fields, not stored truth;
   - canonical UTC instant/interval normalization behavior;
   - EvidenceRef edge and relationship-link distinction;
   - lifecycle/review facts append-only behavior;
   - adapter-boundary guards for no kernel widening and no TS canonicalization clone.
3. Then decide whether any source implementation is safe.

### Phase 4 — seam work remains gated

Do not implement the service/client adapter until:

- service contract is versioned and bounded to ADR-008 safe paths;
- production `PredicateRegistry` ownership is decided;
- canonicalization/hash acquisition is agreed across the service/client boundary;
- golden vectors are promoted to transport-agnostic conformance tests.

## Next ultragoal story recommendation

G005 executed Phase 1 docs/spec cleanup only. Next implementation planning should use the accepted ADR-promoted service north star while preserving the remaining concrete contract gates above; no source/runtime seam changes were made in this ultragoal run.
