# pi-chart Cycle Transaction Metadata — Definitive Three-Input Synthesis

**Date:** 2026-04-25  
**Status:** Project decision artifact — revised to make the three-input weighting explicit  
**Decision owner:** pi-chart project lead  
**Source basis:** original assistant research output from the initial prompt; `openEHR-contribution-audit-details.md`; `openEHR Transaction Model for pi-chart.md`; `README.md`; ADR 016; `event.schema.json`; `write.ts`; `validate.ts`

**Provenance note:** The earlier version was framed as a two-council-report synthesis. This revision explicitly treats the original research output as a separate weighting input. In the files available to this session, the original-output position and `openEHR-contribution-audit-details.md` materially overlap: both argue for Git commit convention now and defer generated cycle manifests until a real consumer appears. That overlap is treated as convergence, not ignored.

## Decision

pi-chart should **borrow openEHR CONTRIBUTION / AUDIT_DETAILS semantics at the Git commit boundary, not as a new chart ontology**.

The project should formalize **one Git commit per agent decision cycle** using a structured commit-message convention with parseable trailers. It should **not** add a canonical `cycle` event type, should **not** add an authoritative top-level `cycles/` directory, and should **not** change `event.schema.json` for cycle metadata.

A generated `_derived/cycles/YYYY-MM-DD/<cycle_id>.yaml` manifest is useful, but it is **deferred until a concrete consumer exists**: replay tooling, export packaging, audit-packet generation, or a failing invariant/debugging case that cannot be resolved from Git + event links alone. When introduced, that manifest must be disposable, rebuildable, and non-authoritative.

The final rule is:

> **openEHR CONTRIBUTION is the pattern; Git commit is the pi-chart implementation. AUDIT_DETAILS becomes structured commit metadata. COMPOSITION/archetype ontology is rejected for internal pi-chart use.**

## Three-input synthesis and weighting

This revision adjudicates three analytical inputs, not two:

1. **Original assistant research output.** Position: borrow openEHR `CONTRIBUTION` / `AUDIT_DETAILS` semantics at the Git boundary; adopt structured commit-message trailers; do not add canonical chart state; allow `_derived/cycles/` only after a concrete replay/export/audit consumer exists.
2. **Council report A: `openEHR-contribution-audit-details.md`.** Position: substantially the same as the original output — Git commit convention now, optional generated `_derived/cycles/` later, no `cycle` event, no top-level authoritative cycle artifact, and no event-schema change.
3. **Council report B: `openEHR Transaction Model for pi-chart.md`.** Position: add a generated cycle manifest now, because replay, auditability, export, agent observability, debugging, and clinician trust benefit from explicit cycle metadata.

The three inputs agree on the conceptual mapping: an openEHR `CONTRIBUTION` is a transaction/change-set, `AUDIT_DETAILS` captures who/when/what/why, `VERSION` maps loosely to individually versioned clinical content, and `COMPOSITION` is a clinical-document boundary rather than a transaction boundary.

They disagree on implementation timing and authority:

- The **original output** and **Council report A** both say the correct near-term implementation is a **Git commit convention**, with `_derived/cycles/` deferred.
- **Council report B** makes the strongest positive case for a **generated cycle manifest**, especially for export, replay, and agent observability.

The final weighting is therefore: **accept Report B’s manifest shape and benefit analysis, but demote it from “implement now” to “deferred generated artifact.”** The reason is not that Report B’s benefits are wrong; it is that pi-chart already has a README-level rule of one commit per agent decision cycle, event-level provenance, a Git-native transaction boundary, append-only correction semantics, and validation. ADR 016 also says existing claim-stream primitives remain the foundation and that new primitives require fixture evidence plus a follow-up ADR. The next proof target is the broad EHR skeleton and deterministic memory-proof projection, not additional chart-layer transaction machinery.

## openEHR transaction model in pi-chart terms

### CONTRIBUTION

In openEHR, a `CONTRIBUTION` is the atomic change-set: a set of committed `VERSION`s plus an audit record. It moves the repository from one consistent state to another.

In pi-chart terms, this is **one Git commit over the patient chart working tree**. The contribution contents are the event ids, note ids, artifact ids, and any superseded/corrected records created in that cycle. The transaction boundary already exists in Git; pi-chart should name it and structure its metadata rather than duplicate it.

### VERSION

In openEHR, a `VERSION<T>` wraps a piece of clinical content with lifecycle and commit-audit metadata. `ORIGINAL_VERSION` adds identifiers, data, preceding version links, lifecycle state, and optional attestation.

In pi-chart terms, the existing clinical event envelope already carries most of this: `id`, `recorded_at`, `author`, `source`, `status`, and explicit links such as `supersedes`, `corrects`, `supports`, `addresses`, `fulfills`, `resolves`, and `contradicts`. pi-chart’s event model is richer than openEHR `VERSION` for agent-native provenance because it also carries activity-centric `transform` metadata.

### VERSIONED_OBJECT

In openEHR, a `VERSIONED_OBJECT` is the full version chain for one logical object.

In pi-chart, this remains **a computed view**, reconstructed from `links.supersedes` and `links.corrects`. It should not become a new object unless a future fixture proves that computed version chains are insufficient.

### COMPOSITION

In openEHR, a `COMPOSITION` is a clinical document or authored unit of meaning. It is not the transaction wrapper.

In pi-chart, the closest analogues are markdown+YAML notes, encounter headers, and linked event clusters. pi-chart should **not** import openEHR archetypes or COMPOSITION semantics as its internal ontology. The existing claim-stream primitives remain the foundation unless Workstream A produces a concrete failure they cannot solve.

### AUDIT_DETAILS

In openEHR, `AUDIT_DETAILS` records:

- `system_id`: logical repository/system receiving the commit;
- `committer`: user, agent, or system responsible;
- `time_committed`: authoritative commit time, distinct from clinical/effective time;
- `change_type`: creation, amendment, modification, synthesis, deleted, attestation, unknown, and later extension values;
- `description`: human-readable reason or summary.

In pi-chart, these map cleanly to Git + event metadata:

- `system_id` → chart repo origin or patient chart id; defer until multi-origin merge/export requires it.
- `committer` → Git committer plus event `author { id, role, run_id }`.
- `time_committed` → Git committer timestamp; event `recorded_at` remains per-event write time.
- `change_type` → structured commit trailer using a small subset.
- `description` → commit subject/body clinical summary.

## Mapping table

| openEHR concept | pi-chart analogue | Decision | Rationale |
|---|---|---:|---|
| `CONTRIBUTION` | Git commit representing one agent decision cycle | **Adopt at Git layer** | Git already provides atomic change-set grouping; no new canonical chart object needed. |
| `AUDIT_DETAILS` | Git author/time/message plus structured commit trailers | **Adopt** | Gives transaction-level who/when/what/why without changing event schema. |
| `VERSION` | Existing event/note/artifact envelope plus Git history | **Reject as new object** | Existing events already carry identity, provenance, status, timing, and links. |
| `VERSIONED_OBJECT` | Computed supersession/correction chain | **Defer** | Current state is a query; materialize only as disposable derived view if needed. |
| `COMPOSITION` | Markdown note, encounter group, linked event cluster | **Reject as internal ontology** | pi-chart must not become openEHR; no Workstream A failure justifies archetypes. |
| `commit_audit` copied into each `VERSION` | Per-event `author`, `recorded_at`, `source`, optional `transform.run_id` | **Already covered** | pi-chart already preserves event-level provenance. |
| `committer` | Git committer + event `author` | **Adopt** | Keep author identity explicit; include `run_id` for agent cycles. |
| `time_committed` | Git committer date; derived manifest `committed_at` | **Adopt** | Preserve distinction between system commit time and clinical effective time. |
| `change_type` | Commit trailer enum | **Adopt selectively** | Use clinically meaningful subset; do not let it become a second event status model. |
| `deleted` change type | Append-only correction/supersession semantics | **Reject** | pi-chart should not physically delete clinical claims as a normal change type. |
| `attestation` / signature | Git signed commits now; future attestation artifact if required | **Defer** | Do not add chart-layer proof until trial/regulatory needs require it. |
| `system_id` | Chart origin, repo URL, or chart id | **Defer** | Single-chart workflows do not need it yet; useful for multi-origin merge/export. |
| openEHR archetypes | None | **Reject** | Hard constraint: do not import unless existing primitives fail concretely. |

## Commit convention to adopt now

Use a human-readable clinical subject plus parseable trailers. The subject and body carry the clinical narrative; the trailers carry the audit skeleton.

```text
cycle: hypotension noted; fluid bolus ordered; SBAR handoff written

Monitor stream showed SBP 86 with tachycardia. Agent assessed likely
symptomatic hypotension, created fluid-bolus intent, and wrote SBAR note
for night-shift handoff.

Cycle-Id: cyc_2026-04-23_0014
Change-Type: modification
Author-Id: pi-agent
Author-Role: agent_clinician
Run-Id: run_2026-04-23_0014
Started-At: 2026-04-23T14:19:14.110Z
Event-Ids: evt_01HX_vitals_bp_1, evt_01HX_vitals_hr_1, evt_01HX_assessment_hypotension, evt_01HX_intent_fluid_bolus
Note-Ids: notes/2026-04-23/sbar_handoff.md
Artifact-Ids:
Schema: event.schema.json@current
Validation: pass
```

### Required trailers

- `Cycle-Id`
- `Change-Type`
- `Author-Id`
- `Author-Role`
- `Run-Id` when an agent is the author
- `Started-At`
- `Event-Ids`
- `Note-Ids` when notes are written
- `Artifact-Ids` when artifacts are written
- `Schema`
- `Validation`

### Derived, not stored in the commit trailer

- `Committed-At`: derive from Git committer timestamp.
- `Commit-Sha`: derive from Git.
- `Projection-Fingerprint`: defer until deterministic projection/replay/export tooling exists.

### `Change-Type` subset

Use:

- `creation` — new clinical content without prior replacement;
- `modification` — clinically meaningful update to existing state;
- `amendment` — correction that does not materially change clinical meaning;
- `synthesis` — agent-derived or projection-derived clinical content;
- `attestation` — human verification/co-signature, once implemented;
- `unknown` — allowed only as an escape hatch and should lint as a warning.

Do not use `deleted` as a normal pi-chart cycle change type. Append-only correction remains expressed through `links.supersedes`, `links.corrects`, and appropriate status handling.

## Deferred generated cycle manifest shape

When a real consumer appears, generate this into `_derived/cycles/`. It must be regenerable from Git + chart contents and safe to delete.

```yaml
# _derived/cycles/2026-04-23/cyc_2026-04-23_0014.yaml
# GENERATED; NOT AUTHORITATIVE

cycle_id: cyc_2026-04-23_0014
clinical_intent: >
  Hypotension noted; fluid bolus ordered; SBAR handoff written.
change_type: modification

author:
  id: pi-agent
  role: agent_clinician
  run_id: run_2026-04-23_0014

started_at: 2026-04-23T14:19:14.110Z
committed_at: 2026-04-23T14:19:31.649Z

contents:
  event_ids:
    - evt_01HX_vitals_bp_1
    - evt_01HX_vitals_hr_1
    - evt_01HX_assessment_hypotension
    - evt_01HX_intent_fluid_bolus
  note_ids:
    - notes/2026-04-23/sbar_handoff.md
  artifact_ids: []

projection_fingerprint:
  algorithm: pi-chart-projection-hash/v1
  as_of: 2026-04-23T14:19:14.110Z
  inputs:
    timeline: sha256:<hash>
    current_state: sha256:<hash>
    open_loops: sha256:<hash>
    narrative: sha256:<hash>
  aggregate: sha256:<hash>

validation_result:
  status: pass
  schema: event.schema.json@current
  checked_at: 2026-04-23T14:19:31.600Z
  report_ref: _derived/validation/2026-04-23/cyc_2026-04-23_0014.json

git:
  commit_sha: <sha>
  subject: "cycle: hypotension noted; fluid bolus ordered; SBAR handoff written"
```

The projection fingerprint should be a conventional canonical-content hash over deterministic view outputs. It should not import unrelated biometric or high-dimensional-computing machinery. Its job is simple: prove what the agent’s chart projection looked like at cycle start.

## What this improves

### Replay

Cycle-aware commits make replay by clinical decision natural: check out the commit for `Cycle-Id`, rebuild `_derived/`, and compare projection hashes if available. Without this, replay still works by event time, but the clinical decision boundary must be inferred.

### Audit

The commit trailer gives transaction-level who/when/what/why while preserving per-event provenance. This matches the useful part of openEHR `AUDIT_DETAILS` without forcing openEHR storage or ontology into pi-chart.

### Export

A future export adapter can map one pi-chart cycle to one openEHR `CONTRIBUTION`, one FHIR transaction bundle, or one chart-packet section. Until such an adapter exists, the export boundary is latent in Git and does not need a chart artifact.

### Agent observability

`Cycle-Id` and `Run-Id` create an O(1) join between chart writes and agent execution traces. Developers can ask: “What did this run write?” and “Which cycle produced this event cluster?”

### Debugging

When validation fails across multiple events, cycle metadata clarifies whether the offending writes were intended as one transaction. `Validation: partial` or `Validation: fail` trailers make suspect cycles searchable through `git log`.

### Clinician trust

The commit subject/body gives a human-readable explanation of the agent’s clinical intent. Clinicians can inspect one paragraph to understand the decision cycle instead of reconstructing intent from four or more event timestamps.

## What this endangers, and how the decision mitigates it

### Append-only simplicity

A canonical cycle file would create a second authoritative index. This decision avoids that by keeping cycle identity at the Git layer and allowing only disposable generated manifests.

### Pure writes

A canonical cycle artifact would force two-phase writes: append events, then write cycle metadata. This decision preserves the current write path: write chart content through sanctioned APIs, validate, and commit once.

### Git-native ergonomics

A top-level `cycles/` directory would create a dual-brain history that can drift under rebase, squash, cherry-pick, or manual repair. This decision keeps Git as the transaction log.

### Schema entropy

A `cycle` event type invites more transaction metadata, then encounter metadata, then folder/episode/composition structures. This decision blocks that slope: no cycle schema change until a concrete fixture failure proves it is necessary.

## Workstream A constraint

Do not recommend openEHR archetypes or COMPOSITIONs as pi-chart’s internal ontology. ADR 016 requires the broad EHR skeleton to prove clinical-memory usefulness through existing claim-stream primitives and derived projections. New primitives require fixture evidence and a follow-up ADR.

No such failure has been shown. Therefore:

- openEHR `COMPOSITION` is useful as an external comparison, not an internal model;
- archetypes are out of scope for pi-chart’s core ontology;
- the next implementation work should remain focused on the six-surface EHR skeleton and deterministic memory-proof projection.

## Implementation actions

1. **Update README / DESIGN commit discipline** to require structured cycle trailers on commits that mutate patient chart content.
2. **Add a commit-message lint** for `Cycle-Id`, `Change-Type`, author/run fields, payload ids, schema, and validation status.
3. **Add a lightweight parser** that can list cycles from `git log` and join each cycle to event/note/artifact ids.
4. **Do not change `event.schema.json`.**
5. **Do not add a canonical `cycle` event type.**
6. **Do not add top-level `cycles/`.**
7. **Record `_derived/cycles/` as deferred** until replay/export/audit tooling has a concrete consumer.

## Forcing functions that would change this decision

Move from “Git commit convention only” to “generated `_derived/cycles/` manifest” when any of these becomes concrete:

1. A replay test fails because two appends that were logically one cycle are replayed out of order or interleaved, and links alone do not diagnose the failure.
2. An export consumer needs a stable cycle boundary and reconstructing it from Git + events would require brittle heuristics.
3. A trial, regulator, or review process requires a stable per-transaction signed audit packet independent of Git commit signing.
4. A validation failure crosses multiple events in one commit, and debugging repeatedly requires reconstructing cycle membership.

Move from “generated manifest” to “canonical cycle event” only if cycle metadata itself becomes clinical claim material that other events must link to via `supports`, `addresses`, `contradicts`, or similar relations. Until then, a cycle is transaction metadata, not clinical content.

## Final project rule

**Adopt openEHR’s transaction insight, not openEHR’s object model.**

- A pi-chart event remains the canonical clinical claim.
- A pi-chart Git commit is the canonical decision-cycle transaction.
- A structured commit trailer is the minimal `AUDIT_DETAILS` borrow.
- A generated cycle manifest is a future disposable projection.
- A canonical cycle event is rejected until proven necessary by fixture evidence.
