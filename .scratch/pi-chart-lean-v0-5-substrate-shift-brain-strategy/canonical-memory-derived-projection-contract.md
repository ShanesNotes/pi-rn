# Canonical memory vs derived projection contract

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Source issue: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/02-canonical-memory-vs-derived-projection-contract.md`
Ralph context: `.omx/context/pi-chart-lean-v0-5-ralph-issues-01-02-20260504T145349Z.md`

## Purpose

This artifact defines the lean v0.5 `pi-chart` boundary between canonical chart memory and derived projections. It is the safety contract that lets a clinician trust views and lets a bounded in-chart assistant reason over chart context without becoming a second source of clinical truth.

The `pi-chart` domain invariant remains:

> The chart is canonical. Current state is a query. Derived summaries are disposable.

## Contract summary

- **Canonical chart memory** records clinical facts, actions, notes, communications, artifact refs, evidence/provenance refs, source/authorship, timing, lifecycle, review, and attestation facts.
- **Derived projections** compute useful views from canonical memory, including current packet, trends, evidence chains, open loops, review state, handoff, care clusters, and shift-brain/task-list views.
- **Hot/warm/cold** describes access behavior and clinical priority, not storage, backend, vector, OpenBrain, runtime, service, semantic retrieval, graph/index, or access-plane architecture.
- **The bounded in-chart assistant** may summarize, cite, explain, suggest, and prompt review over chart memory and projections. It may not silently create accepted chart truth, complete human tasks, or replace clinical judgment.

## Canonical chart memory categories

Canonical memory is the durable substrate. It must preserve source, time, provenance, lifecycle, and links needed for clinical review.

| Category | Canonical memory role | Notes |
| --- | --- | --- |
| Identity and encounter facts | Establish patient, encounter, room/location, assignment/as-of frame | Patient isolation is mandatory |
| Clinical observations | Vitals, labs, diagnostics, bedside findings, I&O entries, device/oxygen facts when charted | Current state is queried from observations, not stored as independent truth |
| Assessments/problems | Human or reviewed working model, active/contested/resolved problems, uncertainty | Evidence links should show support/counterevidence |
| Intents/orders/plans | Provider orders, monitoring plans, medication orders, nursing/protocol intents | Full CPOE is out of scope, but lean intent semantics matter |
| Actions/interventions | Administrations, holds, refusals, omissions, measurements, specimen collection, reviews, assessments performed, nurse-entered verbal/telephone order actions | Actions can fulfill intents and close loops when human-authored or sanctioned |
| Communications | Notes, handoff statements when charted, provider/nurse communications, verbal/telephone/readback/co-sign communications | Report-only speech is workflow evidence until charted or linked |
| Narrative notes | H&P, ICU notes, nursing notes, consults, discharge summaries, prior narrative context | Notes stay source-linked truth; extracted facts require explicit promotion |
| Artifact refs | Report/image/lab/imaging/external refs when referenced by chart facts | Artifact presence is not interpretation by itself |
| Evidence/provenance refs | Links showing primary/context/counterevidence/trigger/confirmatory roles and transform provenance | Lets projections explain why they say something matters |
| Source/authorship | Human, agent, system/import, device, clinician chart action, nurse charted, etc. | Agent/source kind must remain visible |
| Timing | Effective/clinical time, recorded time, intervals, as-of query boundary | Needed for shift-start and current-packet correctness |
| Lifecycle/corrections | Active/final/superseded/entered-in-error, status detail, corrects/supersedes/contradicts/resolves | Append-only truth; no silent mutation |
| Review/attestation | Review actions, verification, rejection, deferral, co-sign, countersign, witness/scribe semantics | Review state is projected from actions, not a mutable target field |

## Derived projection categories

Derived projections are useful because clinicians and agents cannot reread the whole chart every time. They must remain rebuildable and non-authoritative.

| Projection | What it answers | Why it is not canonical truth |
| --- | --- | --- |
| Current packet | What matters right now for this patient/encounter/as-of frame? | It is a selected view over underlying facts |
| Vitals/trends | What changed physiologically? | Trend calculations depend on window, validity, and source choices |
| Evidence chain | Why does this claim/projection matter and what supports it? | It is traversal/rendering over links, not a new claim |
| Open loops/task list | What is pending, due, overdue, blocked, fulfilled, or carried forward? | State is derived from intents/actions/timing/policy, not separate truth |
| Review state | Has material been verified, rejected, attested, deferred, or left unreviewed? | It is computed from governance/review events |
| Handoff projection | What should carry to the next clinician? | It is proposed/derived; human owns final handoff |
| One-page report projection | What high-attention report categories should be visible at shift start? | It organizes chart facts/notes/actions; paper/form layout is not truth |
| Shift brain | What needs attention now, soon, routinely, or at handoff/watch? | It prioritizes work; humans own judgment and completion |
| Care clusters | Which compatible tasks might be grouped? | Advisory grouping does not alter underlying task source/authority |
| Narrative summary | What does a note/history say in brief? | Summary is generated/derived unless explicitly promoted and reviewed |

## Trust model for clinicians

A clinician can trust projections when the projection is transparent about:

1. **Source** — where did this come from?
2. **Time** — when was it clinically true and when was it recorded?
3. **Author/provenance** — who or what produced it?
4. **Evidence** — what supports it, contradicts it, or triggered attention?
5. **Lifecycle** — is it active, final, superseded, corrected, rejected, or uncertain?
6. **Review state** — has a human reviewed, attested, rejected, or deferred it?
7. **Projection boundary** — is this a canonical fact/action/note/ref, or a derived view?

Clinician-facing projections should use plain clinical language:

- "latest charted norepinephrine rate" rather than "projection node value";
- "needs attention" or "review priority" rather than punitive language;
- "source not yet linked" or "report-only item" rather than pretending certainty.

## Reasoning model for the bounded in-chart assistant

The assistant can be useful inside the chart by operating over canonical memory and derived projections with explicit humility.

Allowed assistant behaviors:

- summarize source-linked H&P or ICU note context;
- explain why a vital/lab/drip/task may matter now;
- compare projections and prompt review when sources conflict;
- suggest a care cluster or chart-digging next step;
- cite evidence and uncertainty;
- mark its own output as suggested/provisional/derived;
- defer to human acceptance, charting, and completion.

Explicitly forbidden assistant behaviors:

- direct accepted-writes into canonical chart truth;
- autonomous task completion;
- declaring report/chart/bedside conflicts resolved without clinician action;
- treating generated summaries as canonical truth;
- hiding source/provenance/review uncertainty;
- coupling to hidden simulator/oracle state;
- expanding `pi-ledger` kernel scope.

## Hot/warm/cold access behavior

Hot/warm/cold is a clinical access and priority model.

| Tier | Definition | Examples | Boundary |
| --- | --- | --- | --- |
| Hot | Deterministic current-care facts needed for immediate reasoning and safety | selected patient/encounter/as-of frame, code status, active constraints, current critical vitals, active drips, current safety tasks, critical unreviewed results | Must not depend on semantic retrieval or hidden simulator state |
| Warm | Recent or supporting structured evidence used during deeper chart review | recent ICU note, short vitals/lab trends, review actions, recent I&O windows, open-loop history, medication rationale | Supports chart digging but is still source-linked |
| Cold | Longitudinal/background context | H&P, old consults, prior encounters, discharge summaries, baseline history, old narrative archives | Source-linked and retrieval-eligible later, but not current truth unless explicitly promoted |

This contract does not decide how hot/warm/cold material is stored, indexed, retrieved, embedded, served, authorized, or adapted.

## Shift-start application

For the incoming ICU nurse workflow:

- **Canonical memory** includes charted orders, MAR actions, notes, vitals/labs/I&O observations, review actions, and charted assessments.
- **Report projection** organizes the one-page handoff categories from canonical memory and report-linked evidence.
- **Chart-digging packet** gathers H&P, ICU note, vitals, drips, I&O, labs, and tasks at the right time.
- **Mismatch prompts** compare report/chart/bedside-visible data and ask for clinician review.
- **Shift brain** prioritizes and clusters work but does not complete it.
- **Handoff projection** proposes carry-forward content but the human owns final handoff.

## Boundary checks

| Boundary | Contract |
| --- | --- |
| Backend/vector/OpenBrain/storage/runtime/access-plane | Deferred; hot/warm/cold is behavior only |
| Hidden `pi-sim` internals | Forbidden as chart truth or assistant context |
| `pi-ledger` kernel | Not expanded; any ledger language is future adapter-only |
| Direct agent accepted-writes | Out of scope |
| Autonomous task completion | Out of scope |
| Raw design/generated UI/report sheet authority | Evidence only; not substrate authority |
| EHR clone expansion | Avoided; only clinically useful memory/workflow substrate is in scope |
| Punitive workflow | Forbidden; support competent reprioritization under load |

## Verification prompts for later slices

A future issue or implementation should prove this contract by showing:

1. A current packet can be rebuilt from canonical facts/actions/notes/refs.
2. A one-page report projection links every populated field to source memory or marks it as source-needing/report-only.
3. A shift-brain item explains source, authority, due window, priority tier, and completion criteria.
4. A mismatch prompt cites competing sources and waits for human resolution.
5. An agent-generated suggestion remains provisional until human acceptance.
6. A handoff projection is proposed/derived, with human finalization.
7. No projection requires backend/vector/OpenBrain/storage/runtime architecture to be valid as a product contract.

## Boundary closeout

- [x] Docs-only artifact.
- [x] Canonical memory categories listed with `pi-chart` domain vocabulary.
- [x] Derived projection categories listed as rebuildable/non-authoritative.
- [x] Clinician trust model explained.
- [x] Bounded in-chart assistant reasoning model explained.
- [x] Hot/warm/cold preserved as access behavior.
- [x] No backend/vector/OpenBrain/storage/runtime/access-plane decision.
- [x] No hidden `pi-sim` internals.
- [x] No direct agent accepted-writes.
- [x] No autonomous task completion.
- [x] No `pi-ledger` kernel expansion.
