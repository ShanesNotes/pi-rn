# Phase A Context-Digging Corpus Mining Template

## 1) Authority ladder (mandatory)

When conflict occurs, resolve by source precedence:

1. Direct task/session/user/system instructions
2. AGENTS.md in scope
3. Accepted ADRs in `pi-chart/docs/adr/*.md`
4. Canonical architecture docs (`pi-chart/README.md`, `pi-chart/DESIGN.md`, `pi-chart/ARCHITECTURE.md`, `pi-chart/ROADMAP.md`, `pi-chart/CONTEXT.md`)
5. Active planning docs (`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md` and issue artifacts)
6. Brownfield source and tests in `pi-chart/src/**` and `pi-chart/tests/**` (evidence only)
7. Patient corpus files (`pi-chart/patients/**`) as fixture/scenario evidence only
8. Historical/proposal docs (`memos`, older plans, prototypes) only with explicit promotion

## 2) Row template (per recommendation/mining finding)

For each recommendation row, capture:

- **recommendation_id**: stable ID (`R-001`, etc.)
- **locus**: issue/area + file/section reference
- **claim**: concise recommendation text
- **source_artifact_citation**: one or more authoritative source references
- **brownfield_code_or_test_citation**: one or more file/section/test refs, or `not-covered`
- **corpus_citation**: one or more patient/scenario refs, or `not-covered`
- **reconciliation_state**: one of `adopt`, `revise`, `defer`, `reject`, `open-question`
- **canonical_or_derived_or_rendered**: `canonical` | `derived` | `rendered`
- **hot_warm_cold_classification**: `hot` | `warm` | `cold`
- **v0.5_implication**: decision impact, deferral rationale, or migration need
- **rationale**: why this posture follows the authority ladder
- **open_questions**: explicit follow-up item(s) if unresolved

## 3) Validation requirements (per row)

- Row is complete only if all required fields are present.
- `adopt` rows must include at least one source citation and a complete evidence pair (`brownfield_code_or_test_citation` and `corpus_citation` entries may be `not-covered` only when explicitly justified).
- Every conflict between source, brownfield behavior, and corpus findings must be entered in the mismatch register (never merged implicitly).

## 4) Boundary checks (hard stop)

Must explicitly block:
- source implementation edits in this workstream
- edits to patient fixtures/corpus
- hidden `pi-sim` internals coupling
- vector/OpenBrain/backend commitment
- EHR-clone framing
- patient migration
- direct agent accepted-writes as source truth
- `pi-ledger` kernel expansion

## 5) Context taxonomy

- **Canonical**: provenance-bearing clinical fact and lifecycle truth
- **Derived**: computed projections/summaries over canonical substrate
- **Rendered**: display-focused formats and UI/product surfaces
- **Hot**: immediate care-critical facts; must be deterministic and not depend on semantic/vector retrieval
- **Warm**: deeper but bounded chart/context support for investigation and justification
- **Cold**: longitudinal/background material, generally historical, typically deferred to retrieval context

## 6) Reconciliation state meanings

- `adopt`: preserve for v0.5 recommendation (authoritative fit)
- `revise`: preserve with explicit constraint, scope, or lifecycle correction
- `defer`: postpone pending ADR/HITL, missing tests, or evidence gaps
- `reject`: intentionally not carried into v0.5 design
- `open-question`: explicit unresolved item requiring downstream decision

## 7) Mismatch register entry format

| recommendation_id | source | brownfield | corpus | conflict_type | state | v0.5_action | owner | due |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R-XXX | cite/`not-covered` | cite/`not-covered` | cite/`not-covered` | e.g., scope, fidelity, conflict, missing evidence | adopt/revise/defer/reject/open-question | clear disposition | role or AFK slice | date |
