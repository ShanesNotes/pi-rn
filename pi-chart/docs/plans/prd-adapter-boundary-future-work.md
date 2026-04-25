# PRD — BND-001 Adapter Boundary Future Work

## Status and source inputs

- Card: BND-001.
- Artifact depth: executable planning cards for a deferred boundary lane; not an adapter build plan.
- Current status: deferred / future work; planning-only updates are allowed.
- Durable backlog entrypoint: `docs/plans/kanban-prd-board.md`.
- Planning authority: `.omx/plans/prd-kanban-backlog-expansion.md`, especially the thin-PRD guardrail.
- Source inputs:
  - `memos/definitive-fhir-boundary-pi-chart.md`
  - `memos/pi-chart-boundary-adapter-definitive-synthesis.md`
  - `memos/pi-chart-openEHR-cycle-decision-synthesis.md`
  - `ROADMAP.md`
  - `ARCHITECTURE.md`
  - `README.md`
  - `.omx/plans/workstream-a-memory-proof-acceptance-report.md`
  - parent workspace `AGENTS.md` boundary note: `pi-agent/` must not couple directly to hidden `pi-sim/` source.

## RALPLAN-DR summary

- Principles: chart remains canonical; boundaries are export/read seams before integration; current repo behavior outranks proposal memos; tests/docs precede implementation; hidden simulator state never crosses.
- Decision drivers: avoid premature pi-agent/pi-sim coupling; keep adapter options visible for later HITL; make future work executable without adding contracts now.
- Options considered:
  1. Keep a thin deferred PRD only — safest, but future agents must rediscover execution slices.
  2. Deepen into planning tracer bullets — chosen because it adds testable gates without product code.
  3. Promote to adapter PRD now — rejected until a concrete consumer, boundary mode, and export/fingerprint scope exist.

## Authority / proposal status

Accepted project constraints for this card:

- FHIR is a read/export boundary, never pi-chart's internal ontology, storage model, view model, or write API.
- The chart remains canonical; external projections are transient, deterministic exports over chart-visible facts.
- openEHR contributes transaction/audit semantics at the Git commit boundary only; openEHR archetypes and COMPOSITION semantics are rejected as internal model.
- Workstream A has accepted the memory-proof seam and explicitly deferred fingerprint/export, FHIR/Medplum/HealthChain/SMART/CDS Hooks adapters, read-path audit, legal export, UI rendering, and proposed ADR17 policy.

Proposal-only / non-authoritative items:

- Any concrete adapter API shape, TypeScript module layout, file ownership, public signature, test file list, or documentation tree from the adapter synthesis memo.
- Any external conformance target beyond the already named FHIR R4 / 4.0.1 first-boundary research direction.
- Any generated cycle manifest, export packet, fingerprint contract, or adapter-facing API until a concrete replay/export/audit consumer exists.

## Brownfield boundary reality

What pi-chart may later expose, after HITL approval:

- Deterministic read projections over public chart facts: events, notes, artifacts, vitals, current-state views, open-loop views, narrative views, memory-proof output, validation/rebuild evidence, and Git commit metadata.
- Documentation of eligible source surfaces and forbidden source surfaces.
- Adapter PRD/test-spec inputs that describe expected exports without importing adapter runtime into chart core.

What pi-chart must not know:

- `pi-agent` runtime internals, prompts, agent memory, model traces, or container filesystem beyond explicitly exposed chart interfaces.
- `pi-sim` source, hidden physiology, private simulator state files, or non-chart oracle data.
- FHIR server/search/auth workflows, SMART/CDS Hooks runtime, openEHR archetype ontology, Medplum/HealthChain SDK assumptions, or production EHR workflow semantics.

## Refined acceptance criteria

This deferred-boundary lane is complete when:

1. Source inputs and accepted/proposal-only authority are explicit.
2. The PRD states what pi-chart may expose later and what it must not know.
3. Tracer bullets are planning-only, each with owned files, first validation, and verification command.
4. Future readiness is tied to named prerequisites and HITL, not vague integration interest.
5. FHIR/openEHR remain external-boundary concepts and do not pollute chart-core Phase A execution.
6. No adapter code, API contract, runtime interface, schema change, fixture change, or cross-project integration is added.
7. Hidden simulator state and direct pi-agent-to-pi-sim coupling are forbidden by explicit anti-coupling rules.
8. Deferrals preserve Workstream A's current focus and acceptance report.

## Thin tracer bullets

| Bullet | Purpose | Owned files | First failing / characterization validation | Verification command | Boundary |
|---|---|---|---|---|---|
| BND-TB-0 Authority quarantine and source inventory | Keep source authority, proposal-only inputs, concrete memo API/file/test proposals, and current repo seams visible. | `docs/plans/prd-adapter-boundary-future-work.md`; `docs/plans/test-spec-adapter-boundary-future-work.md` | Structural check fails if source inputs, brownfield reality, accepted/proposal status, or proposal-only adapter API/file/test quarantine disappears. | `python3 -c "from pathlib import Path; t=Path('docs/plans/prd-adapter-boundary-future-work.md').read_text(); assert 'BND-TB-0' in t and 'Authority / proposal status' in t and 'Brownfield boundary reality' in t and 'proposal-only adapter API/file/test quarantine' in t"`. | Docs only; no source ownership. |
| BND-TB-1 Consumer/readiness and boundary-mode matrix | Force named consumer, export/import direction, representation, fingerprint scope, rejected surfaces, and HITL owner before adapter PRD. | `docs/plans/prd-adapter-boundary-future-work.md`; `docs/plans/kanban-prd-board.md` | Validation fails unless HITL requires consumer, directionality, representation, fingerprint scope, rejected surfaces, HITL owner, and hidden-simulator exclusion. | `python3 -c "from pathlib import Path; t=Path('docs/plans/prd-adapter-boundary-future-work.md').read_text(); assert 'Named consumer' in t and 'Boundary mode' in t and 'Fingerprint/export scope' in t"` plus `git diff -- docs/plans/kanban-prd-board.md`. | No default consumer; export-only remains default until HITL changes it. |
| BND-TB-2 Chart-visible source eligibility | Define what future exports may read without leaking simulator or agent internals. | `docs/plans/prd-adapter-boundary-future-work.md`; `docs/plans/test-spec-adapter-boundary-future-work.md` | Characterization check requires “may expose” and “must not know” lists and forbids `pi-sim` source dependency language. | `python3 -c "from pathlib import Path; t=Path('docs/plans/prd-adapter-boundary-future-work.md').read_text(); assert 'What pi-chart may later expose' in t and 'What pi-chart must not know' in t"` plus `git status --short -- src schemas patients scripts`. | Only public chart facts can cross. |
| BND-TB-3 FHIR/openEHR decision ledger | Preserve FHIR R4 document-Bundle direction and openEHR Git-audit semantics as deferred boundary decisions. | `docs/plans/prd-adapter-boundary-future-work.md`; `docs/plans/test-spec-adapter-boundary-future-work.md` | Validation fails if FHIR/openEHR are described as internal models or implementation-ready contracts. | `python3 -c "from pathlib import Path; t=Path('docs/plans/prd-adapter-boundary-future-work.md').read_text(); assert 'FHIR is a read/export boundary' in t and 'openEHR contributes transaction/audit semantics at the Git commit boundary only' in t"`. | Research/decision only; no adapter module/API. |
| BND-TB-4 Promotion split and deferral guard | Make later promotion paths explicit: research spike, adapter PRD, split by surface, reject/supersede. | `docs/plans/prd-adapter-boundary-future-work.md`; `docs/plans/kanban-prd-board.md` | Validation fails unless promotion options and explicit deferrals remain present. | `python3 -c "from pathlib import Path; t=Path('docs/plans/prd-adapter-boundary-future-work.md').read_text(); assert 'Promote to adapter PRD' in t and 'Explicit deferrals' in t"` plus board row review. | HITL approval required before product-root ownership. |

## Consumer readiness matrix

| Potential consumer | Default direction | First representation candidate | Fingerprint/export scope | Rejected surfaces until HITL | HITL owner needed |
|---|---|---|---|---|---|
| pi-agent container handoff | Export/read-only | Chart-visible memory-proof or derived views | None selected | pi-agent internals, model traces, hidden sim state | Yes |
| External EHR export | Export/read-only | FHIR R4 document Bundle candidate | None selected | FHIR server/search/write/auth | Yes |
| Replay/audit packet | Export/read-only | Git commit metadata plus chart proof outputs | None selected | Authoritative cycle manifest | Yes |
| Clinical UI / CDS | Read-only first | Existing chart views or documentation handoff | None selected | CDS Hooks listener, workflow engine | Yes |
| Regulator/data partner | Export/read-only | Deferred legal/export packet | None selected | Legal retention/redaction policy by implication | Yes |

## Deferral / readiness decision options

A HITL reviewer must choose one of these before any implementation card exists:

1. **Keep deferred** — default. Boundary remains documented future work while Phase A / chart-core work proceeds.
2. **Promote to research spike** — allowed only to answer unresolved profile/canonicalization questions without product code.
3. **Promote to adapter PRD** — allowed only after a concrete consumer exists and Workstream A export/fingerprint semantics are stable enough to define acceptance tests.
4. **Split by boundary type** — separate FHIR export, openEHR transaction metadata, audit/fingerprint, and UI/CDS surfaces if one area becomes ready before the others.
5. **Reject / supersede** — close BND-001 if a later accepted ADR chooses a different external-boundary strategy.

## HITL checkpoint before implementation

HITL promotion gate: Before BND-001 may become an adapter PRD, implementation card, API/interface design, runtime integration, cross-project integration task, or product-root ownership assignment, a human reviewer must record:

- Named consumer: pi-agent container handoff, external EHR export, replay/audit packet, clinical UI/CDS, regulator/data partner, or another named consumer.
- Boundary mode: export-only, import-capable, or bidirectional; export-only remains the default.
- First representation: whether FHIR R4 document Bundle remains the first external representation.
- Fingerprint/export scope: Bundle, memory-proof JSON, Markdown projection, AuditEvent, selected canonical fields, or none yet.
- Allowed source surfaces: only chart-visible events/notes/artifacts/vitals/views/derived proof outputs and Git metadata.
- Forbidden sources: hidden simulator state, `pi-sim` source, pi-agent internals, model traces, and non-chart oracle data.
- HITL owner and recorded decision location.
- Confirmation that no hidden simulator state may cross the boundary.
- Without this record, BND-001 stays deferred and docs-only.

## Boundary risks and anti-coupling rules

- Risk: adapter vocabulary leaks into chart core. Rule: FHIR/openEHR terms stay in docs/adapters/research until a HITL-approved adapter PRD assigns product files.
- Risk: future agent reads hidden simulator state for a convenient export. Rule: only public chart facts and generated chart views may be eligible export inputs.
- Risk: pi-agent gets a shortcut to pi-sim through pi-chart planning. Rule: pi-chart boundary docs may name consumers, not grant cross-project source access.
- Risk: proposal memos become accepted architecture by repetition. Rule: every memo-derived claim must stay accepted, proposal-only, or deferred.
- Risk: fingerprint/export scope is chosen too early. Rule: no digest or packet contract until payload scope, timestamps, canonicalization, and verifier semantics are selected.

## Verification command

```bash
python3 - <<'PY'
from pathlib import Path
prd = Path('docs/plans/prd-adapter-boundary-future-work.md')
test = Path('docs/plans/test-spec-adapter-boundary-future-work.md')
text = prd.read_text()
required = [
  'RALPLAN-DR summary', 'Brownfield boundary reality', 'Consumer readiness matrix', 'Refined acceptance criteria',
  'Thin tracer bullets', 'HITL checkpoint before implementation',
  'Boundary risks and anti-coupling rules', 'proposal-only adapter API/file/test quarantine', 'Explicit deferrals',
  'memos/definitive-fhir-boundary-pi-chart.md',
  'memos/pi-chart-boundary-adapter-definitive-synthesis.md',
  'memos/pi-chart-openEHR-cycle-decision-synthesis.md',
  'ROADMAP.md', 'ARCHITECTURE.md', 'README.md',
  '.omx/plans/workstream-a-memory-proof-acceptance-report.md',
]
required += [f'BND-TB-{i}' for i in range(5)]
missing = [s for s in required if s not in text]
if missing:
    print('Missing:', missing)
    raise SystemExit(1)
if not test.exists():
    print('Missing paired test spec')
    raise SystemExit(1)
if len(text.splitlines()) > 220:
    print('PRD too long')
    raise SystemExit(1)
PY
```

## Explicit deferrals

- Adapter implementation, module layout, public API signatures, runtime interfaces, cross-project integration, and product-root file ownership.
- FHIR import, write-back, public FHIR API, search, history, `_revinclude`, subscriptions, SMART/OAuth, CDS Hooks, GraphQL, Bulk Data, and platform auth.
- Pharmacy/MAR, Task, CarePlan, DiagnosticReport grouping, Encounter/ADT, scheduling, billing, claims, and production EHR workflows.
- openEHR archetypes, internal COMPOSITION object model, authoritative cycle manifests, and schema changes for transaction metadata.
- Fingerprint/export contract until payload scope, timestamp rules, canonicalization, and downstream verification semantics are selected.
- Proposed ADR17 actor/attestation/review policy until HITL/ADR approval.
