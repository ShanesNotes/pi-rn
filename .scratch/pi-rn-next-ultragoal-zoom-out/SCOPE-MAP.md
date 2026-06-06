# Next ultragoal zoom-out scope map

Date: 2026-05-31
Mode: `$zoom-out`
Purpose: capture the largest useful planning scope before the next ultragoal.

## One-sentence north star

Pi-RN is a bounded clinical-agent harness where many clinician/agent entry points share one patient-scoped, append-only clinical truth stream, while hidden simulation truth stays hidden and clinician-facing views remain projections over source-linked chart truth.

## Current durable decision baseline

The prior ultragoal is complete. Its accepted baseline is:

- Human `grill-with-docs` decisions D001-D012 are the current authority for the field-contract and service-boundary decisions.
- `pi-ledger` ADR 009 accepts a private/internal clinical-truth service around `ledger-core`.
- `pi-chart` ADR 021 accepts this access boundary:

```text
clinical entry points -> Pi-RN/pi-chart app/backend -> private internal clinical-truth service
```

- First service transport: private/local gRPC over Unix-domain socket, behind a versioned contract.
- First service storage posture: per-patient append-only WAL/log.
- For a patient ledger, many clinicians/agents may submit concurrently, but the service assigns one authoritative append order.
- `pi-chart` bends to the frozen `pi-ledger` kernel interface; no TypeScript reimplementation of canonicalization/admission.
- No hidden `pi-sim` internals may enter `pi-agent`, `pi-chart`, or `pi-ledger`.

## System map at maximum scope

```text
Hidden patient runtime domain
  pi-sim
    owns hidden patient state, scenario time, provider routing, validation, latent findings
    publishes only public telemetry lanes under pi-sim/vitals/
      |
      | public telemetry boundary
      v
Display-only domain                         Clinical chart domain
  pi-monitor                                pi-chart / Pi-RN app/backend
    reads public telemetry                    owns clinician workflow, chart views,
    renders freshness/alarms only             projections, source labels, suggestions,
    writes no chart truth                     review prompts, and app/backend mediation
                                                |
                                                | private/internal client contract
                                                v
                                           Clinical-truth service domain
                                             pi-ledger service around ledger-core
                                               owns durable per-patient append-only truth,
                                               admission, canonicalization, record hashes,
                                               append order, bitemporal point reads
                                                |
                                                v
                                           ledger-core kernel
                                             Claim validation -> append/revision admission
                                             -> append ledger -> query point reads

Bounded agent domain
  pi-agent
    eventually containerized; sees only explicit exposed chart/public surfaces;
    never sees hidden pi-sim internals or direct ledger internals.
```

## Domain ownership map

| Domain | Owns | Allowed callers/consumers | Must not own/do |
| --- | --- | --- | --- |
| `pi-sim` | Hidden patient runtime, provider state, scenario time, latent truth, public telemetry production | `pi-monitor` display reads; future `pi-chart` telemetry adapter; bounded `pi-agent` only if explicitly exposed | Do not leak hidden state/oracles/provider internals into public fixtures or agent-visible context |
| `pi-monitor` | Display-only native monitor over public telemetry | Public `pi-sim/vitals` lanes | No chart truth writes; no `pi-chart`/hidden `pi-sim` imports |
| `pi-chart` | Agent-native clinical chart, clinician-facing views, source/review language, app/backend mediation, suggestions and promotion workflow | Clinical entry points, agents/tests via sanctioned APIs; future client of clinical-truth service | No direct hidden `pi-sim`; no direct browser/EHR calls to ledger service; no TS canonicalization clone |
| `pi-ledger` | Claim ledger kernel and future private clinical-truth service: canonicalization, admission, hashes, append order, WAL/log, bitemporal reads | `pi-chart` backend/service layer through versioned private contract | No `pi-chart` brownfield imports, UI schemas, patient directories, generated assets, hidden `pi-sim` |
| `pi-agent` | Bounded clinician-agent workspace/runtime policy | Explicit exposed chart/EHR/public telemetry surfaces | No hidden simulator source or direct accepted-truth writes without future policy |

## Current code/module map and callers

### `pi-chart` current brownfield chart substrate

Caller rule: external callers import from `pi-chart/src/index.ts`, not internals.

Current write path:

```text
agent / extension / CLI / test
  -> src/index.ts
  -> write.ts appendEvent / writeCommunicationNote / writeArtifactRef
  -> patient timeline files: events.ndjson, notes/*.md, vitals.jsonl
  -> validate.ts for graph integrity
  -> derived.ts for disposable _derived views
```

Current read/view path:

```text
agent / UI / tests
  -> src/index.ts
  -> views/{timeline,currentState,trend,evidenceChain,openLoops,narrative,...}
  -> read.ts + time.ts + evidence.ts + schemas
  -> JSON-serializable clinician-facing projections
```

Important modules:

- `src/types.ts`: brownfield `EventEnvelope`, `VitalSample`, `NoteFrontmatter`, links, status/certainty/source types.
- `src/write.ts`: sanctioned local write boundary.
- `src/validate.ts`: whole-chart validation, link integrity, patient isolation, lifecycle/link rules.
- `src/views/*`: clinician-facing view primitives and projection guarantees.
- `src/evidence.ts`: `EvidenceRef` parse/format and source-trail support.
- `src/time.ts`: chart-clock/as-of behavior.
- `schemas/*`: current fixture/export/archive validation, not the future service contract by itself.

### `pi-ledger` current kernel

Safe new-claim lifecycle:

```text
raw Claim JSON
  -> claim::validate_claim -> ValidatedClaim
  -> admission::AppendAdmissibleClaim::admit
  -> admission::RevisionAdmissibleClaim::admit when correction
  -> ledger::AppendLedger::{append_admissible, append_revision_admissible}
  -> query::point_read over trusted entries
```

Important modules:

- `canonical.rs`: deterministic canonical JSON and Record hash authority.
- `hash.rs`: typed Record/Entry hash values.
- `time.rs`: canonical UTC timestamp/valid-time enforcement.
- `claim.rs`: Claim validation and field extraction authority.
- `predicates.rs`: predicate definitions/registry policy.
- `admission.rs`: append and revision admission.
- `ledger.rs`: patient-scoped append order, accepted metadata, entry/head hashes.
- `query.rs`: bitemporal point reads over trusted entries.

Next service layer is not implemented yet; ADR 009 authorizes planning it as a private service around these modules, not bypassing them.

### `pi-sim` public telemetry producer

Important public surfaces:

- `pi-sim/vitals/README.md`
- `pi-sim/vitals/.lanes.json`
- `pi-sim/vitals/current.json`, `timeline.jsonl`, `events.jsonl`, waveform/status files, scenario metadata
- public-contract fixtures under `pi-sim/vitals/fixtures/public-contract/**`

Only these public surfaces are eligible for sibling consumers. Hidden scripts/runtime/provider state are producer internals.

### `pi-monitor` display consumer

Important modules:

- `monitor-ingest`: public telemetry ingestion.
- `monitor-core`: display model/freshness semantics.
- `monitor-ui`, `monitor-cli`, `monitor-app`: render/CLI/native app surfaces.
- `pulse-public-frame`: public-frame model.

`pi-monitor` is relevant to the next ultragoal mainly as a boundary proof: public telemetry can be consumed without becoming chart truth.

### `pi-agent` bounded workspace

`pi-agent` is relevant as the future consumer/runtime constraint:

- It should receive chart/public context through explicit exposed interfaces.
- It should not gain raw `pi-sim` or private `pi-ledger` access.
- It should not directly append accepted clinical truth without a future proposal/review policy.

## Charted clinical fact field-contract map

The next planning scope should preserve the field-contract decisions already made:

- `context_segment`: `factShape=observation`, `predicateId=observation.context_segment`.
- Report/note mentions: contextual/source narrative; discrete findings are separate `observation` facts linked to authoritative ordered diagnostic/lab/read evidence.
- Review/attestation: separate append-only `act` facts; not target mutation.
- Standard review predicates: `review.reviewed`, `review.verified`, `attestation.signed`, `attestation.cosigned`, `attestation.readback`.
- Review target linkage: one `evidence: EvidenceRef[]` edge; no duplicate `attests_to` / `reviewed_refs` object fields.
- Suggestions: `Suggested by Pi` remains provisional until clinician-owned promotion such as Add to Shift Brain; suggestion does not become accepted truth by itself.
- Clinician-facing views are projections: Current Snapshot, Shift Brain, Report View, Handoff View, Chart Review Packet, Source trail, Why am I seeing this?.

## Remaining gates before source/runtime seam work

The largest next ultragoal should not skip these gates:

1. Production `PredicateRegistry` ownership/loading and versioning.
2. Canonicalization/hash acquisition across the service/client boundary.
3. Versioned clinical-truth-service contract bounded to ADR-008 safe paths.
4. Transport-agnostic conformance/golden-vector tests.
5. Per-patient WAL/log storage/rebuild contract and corruption/replay behavior.
6. Multi-entry-point concurrency semantics: service-side append order, correction/review target recheck against current ledger state.
7. Pi-chart adapter boundary: backend-mediated client, no direct UI/browser/EHR ledger calls.
8. Clinical suggestion/review policy boundary: Pi may suggest/explain/cite/prompt; it does not chart, verify, complete, sign, or decide.
9. Observable charting seam: public telemetry becomes chart truth only through explicit adapter/clinician validation.
10. Bounded-agent runtime contract: `pi-agent` only sees mounted/exposed clinical/public surfaces.

## Recommended next ultragoal objective

Create the executable planning substrate for the clinical-truth service/client seam without yet implementing production clinical writes:

> Turn the accepted charted-clinical-fact field contract and clinical-truth-service ADRs into a versioned service contract, conformance/golden-vector suite, storage/rebuild plan, and pi-chart adapter test plan that prove the seam can be implemented safely while preserving patient scope, source-linked chart truth, append-only review/correction semantics, and hidden-simulator boundaries.

## Candidate next ultragoal stories

1. **Baseline and dirty-state capture**
   - Preserve the current uncommitted prior-ultragoal artifacts.
   - Re-run or record baseline checks only if source files change.

2. **Contract inventory and gap register**
   - Crosswalk `pi-chart` field-contract issues 01-15 against `pi-ledger` ADR-008 safe paths and ADR-009/021.
   - Produce a gap register for registry, hashes, storage, transport, replay, and adapter boundaries.

3. **Versioned service contract PRD/test-spec**
   - Define service operations only around safe lifecycle paths: validate/admit/append/revision/point-read/snapshot/rebuild as appropriate.
   - Keep it private/internal and backend-mediated.

4. **Golden-vector/conformance design**
   - Promote kernel fixtures into transport-agnostic vectors: canonical bytes, Record hash, append result, correction target proof, point-read result, expected errors.
   - Include negative vectors for patient mismatch, shape mismatch, stale correction target hash, non-canonical timestamps, caller-supplied K3 metadata.

5. **Per-patient WAL/log storage plan**
   - Specify log record shape, fsync/replay boundaries, head validation, rebuild from snapshot/log, corruption handling, and migration path to later stores.

6. **Pi-chart adapter test plan before adapter code**
   - EventEnvelope/VitalSample/NoteFrontmatter round-trip fixtures.
   - Predicate/object mapping fixtures.
   - EvidenceRef and review/attestation facts.
   - Clinician-surface projection assertions from fields, not stored truth.

7. **Boundary/security/access plan**
   - Confirm clinical entry points go through app/backend.
   - Confirm no hidden `pi-sim`, no direct browser/EHR ledger-service access, no direct `pi-agent` accepted-write authority.

8. **Implementation readiness gate**
   - Independent architecture/code-review pass.
   - Only then decide whether a following ultragoal may implement a small vertical slice.

## Suggested non-goals for the next ultragoal

- Do not build the full production clinical-truth service yet.
- Do not connect browsers/EHR plugins directly to `pi-ledger`.
- Do not introduce a TS canonicalization clone.
- Do not ingest hidden `pi-sim` internals or latent findings.
- Do not make `pi-agent` a direct accepted-truth writer.
- Do not treat Shift Brain, Report View, or Handoff View as chart truth stores.
- Do not choose vector/OpenBrain/retrieval architecture unless a separate decision requires it.

## Evidence inspected

- `CONTEXT-MAP.md`
- `pi-chart/CONTEXT.md`, `pi-chart/ARCHITECTURE.md`, `pi-chart/DESIGN.md`
- `pi-ledger/CONTEXT.md`, `pi-ledger/docs/ledger-core-public-interface.md`
- `pi-agent/CONTEXT.md`, `pi-sim/CONTEXT.md`, `pi-monitor/CONTEXT.md`
- `pi-ledger/docs/adr/009-clinical-truth-service.md`
- `pi-chart/docs/adr/021-clinical-truth-service-client-boundary.md`
- `.scratch/pi-rn-reentry-audit-28052026/GRILL-WITH-DOCS-HUMAN-DECISIONS.md`
- `.scratch/pi-rn-reentry-audit-28052026/IMPLEMENTATION-READY-PLAN.md`
- `.scratch/pi-rn-reentry-audit-28052026/FINAL-REVIEW-GATE.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/RECONCILIATION.md`
- `omx ultragoal status --json`
- current `git status --short`
