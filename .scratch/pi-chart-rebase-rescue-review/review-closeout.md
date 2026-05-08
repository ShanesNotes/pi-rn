# Review closeout

Status: completed docs-only rescue review

## Summary of reviewed evidence

This review consolidates prior mining and rebase evidence into a promotion map before fresh pi-chart implementation. It treats prior work as high-signal evidence, not implementation authority.

Key reviewed sources:

- ADR016: broad EHR skeleton as clinical-memory proof surface.
- ADR017: actor, attestation, and review taxonomy.
- ADR018: clinical truth substrate over prototype cockpit and source hygiene.
- ADR019/ADR020: clean-canvas posture and `pi-ledger` kernel ownership.
- `pi-chart/docs/architecture/source-authority.md`: promotion policy for lower-authority artifacts.
- Phase A corpus/mining closeout and reconciliation registers.
- v0.5 foundation decision register.
- adapter readiness gate.
- current `memoryProof` and `contextBundle` read-side projection evidence.

## Relationship to existing workstreams

| Workstream | Existing purpose | This review relationship | Action | Reason | Risk if confused |
|---|---|---|---|---|---|
| `.scratch/pi-chart-phase-a-context-digging-corpus-mining/` | Broad source/corpus/brownfield mining and substrate recommendation. | Reuse its evidence inventory and merge selected rows into exact promotion decisions. | merge | This review narrows Phase A outputs into foundation rescue, EHR leverage, agent-native gap, and closeout destinations. | Repeating mining rather than deciding destinations. |
| `.scratch/pi-chart-pi-ledger-adapter-strategy/` | Chart-to-ledger adapter planning and readiness gates. | Reuse unchanged as the adapter gate; feed only adapter-specific outcomes into it later. | reuse | Adapter implementation remains blocked until kernel evidence and mechanism decision exist. | Premature adapter implementation or kernel leakage. |
| `.scratch/pi-ledger-claim-ledger-kernel/` | Active ledger kernel PRD/issues. | Leave execution untouched; only feed back true kernel questions as future kernel issues/ADRs. | leave untouched | This review is chart rescue/foundation work, not a kernel redesign. | Chart workflow concerns pollute kernel. |
| `.scratch/pi-chart-v0-5*` | V0.5 strategy/foundation/salvage material, including stale chart-local kernel lane. | Merge surviving decisions; supersede stale chart-local kernel-home assumptions by ADR020. | merge | High-signal foundation decisions remain useful; implementation-home details must track ADR020. | Agents revive stale `pi-chart/src/claim-ledger` authority or handoff tunnel vision. |

## Promotion map

| Rescued idea ID | Rescued idea | Source artifact | Final outcome | Destination | Decision owner | Rationale | Required next step |
|---|---|---|---|---|---|---|---|
| GOLD-001 | Clinical memory substrate north star | ADR016; user direction | promote to future ADR | `pi-chart/docs/adr/` or root ADR | architect + maintainer | Need precise wording that preserves EHR rails without EHR-clone drift. | Draft ADRC-001. |
| GOLD-002 | Broad shallow EHR skeleton as proof surface | ADR016; clinical-reference | promote to PRD/issue | Future pi-chart substrate PRD | product/architect | Required to prove useful clinical memory across real surfaces. | Slice function-first broad-skeleton issue. |
| GOLD-003 | Chart-once/project-many documentation relief | ADR016; Phase A | promote to future ADR | Projection authority ADR | architect | Core burden-offload primitive; needs derived-view non-authority guardrail. | Draft ADRC-003. |
| GOLD-004 | Deterministic memory-proof projection | `src/views/memoryProof.ts`; ADR016 | promote to PRD/issue | Projection contract PRD/issue | pi-chart owner | Useful acceptance artifact, but name/semantics need revision. | Rename/reshape in projection contract issue. |
| GOLD-005 | Thin contextBundle read-side packaging | `src/views/bundle.ts`; CB plans | keep as prototype evidence | Prototype evidence archive | pi-chart owner | Demonstrates bounded wrapper but lacks ContextPacket guarantees. | Cite as evidence only in ContextPacket ADR. |
| GOLD-006 | TaskFrame / ContextPacket / ContextReceipt lineage | v0.5 spec prep/package map | promote to future ADR | ContextPacket/ContextReceipt ADR | architect | Likely core agent-native saddle for LLM navigation. | Draft ADRC-002. |
| GOLD-007 | Evidence/provenance/source/time grammar | brownfield types/validator; Phase A | promote to PRD/issue | pi-chart substrate vocabulary PRD | pi-chart architect | Essential chart memory rails; brownfield shape must be translated, not copied. | Build vocabulary crosswalk issue. |
| GOLD-008 | Review/attestation/authorship lifecycle governance | ADR017; review pack | promote to future ADR | governance/accountability ADR | architect + security-reviewer | Core to clinician accountability and agent proposal safety. | Extend ADR017 into v0.5 governance scope. |
| GOLD-009 | Open loops, MAR/order/result-review workflow substrate | Phase A packs; shift-brain strategy | promote to PRD/issue | workflow projection PRD/issue | pi-chart owner | Clinically valuable, but must remain projection over chart memory. | Draft workflow projection issue. |
| GOLD-010 | Hot/warm/cold context access behavior | Phase A hot/warm/cold model | promote to PRD/issue | access behavior PRD/issue | architect | Useful context priority model without choosing backend prematurely. | Draft access-behavior issue with backend deferred. |
| GOLD-011 | Agent output as proposal/review material | FDR-006; ADR017 | promote to future ADR | agent proposal/review ADR | security-reviewer + architect | Must be fixed before agent write/capture surfaces. | Draft ADRC-004/ADRC-007 split. |
| GOLD-012 | Rendered/prototype navigation questions | rendered chart digging pass | keep as prototype evidence | design/prototype evidence | designer + architect | Preserves product affordance questions; raw UI/API not authority. | Reference only in product UX review. |
| GOLD-013 | Curated patient scenarios as clinical pressure tests | patient corpus atlas; patient review packets | promote to PRD/issue | fixture/scenario salvage PRD/issue | test-engineer + architect | Needed after kernel evidence to test chart memory breadth. | Draft scenario salvage issue after substrate PRD. |

## Rejections and rationale

| Rejected item | Rationale |
|---|---|
| Direct pi-chart source implementation from this review | Would turn rescue findings into architecture before promotion gates close. |
| Treating current brownfield event shape as new substrate authority | Brownfield behavior is evidence; future substrate vocabulary must be re-justified. |
| Treating generated UI/design assets as architecture | They preserve navigation questions only. |
| Treating broad EHR skeleton as full EHR product scope | The skeleton is a clinical-memory proof surface, not scheduling/billing/admin scope. |
| Folding ledger kernel concerns back into pi-chart | Superseded by ADR020 and `pi-ledger` context. |
| Using patient corpus as kernel fixture authority | Curated patients are scenario pressure, not kernel K0-K6 evidence. |

## Deferred / open questions

| Question | Decision owner | Suggested destination |
|---|---|---|
| Exact north-star ADR wording for “agent-native chart” vs “not full EHR.” | maintainer + architect | ADRC-001 |
| Minimum ContextPacket fields and which packet/receipt data belongs in ledger vs chart/access plane. | architect | ADRC-002 |
| First pi-chart to pi-ledger integration mechanism. | maintainer + dependency-expert | adapter strategy issue 04 |
| Which chart substrate fields are needed before adapter mapping. | pi-chart architect | future substrate PRD |
| Which clinical workflow states are core memory vs product/UI policy. | maintainer + pi-chart owner | workflow projection PRD |
| Which standards adapter should be first, if any. | researcher + architect | ADRC-005 |

## Verification evidence

### Unit-style checks

- Required artifacts exist in this directory:
  - `README.md`
  - `requirements-summary.md`
  - `legacy-EHR-leverage-audit.md`
  - `agent-native-gap-audit.md`
  - `foundation-decision-matrix.md`
  - `prototype-gold-register.md`
  - `splice-risk-matrix.md`
  - `future-ADR-map.md`
  - `review-closeout.md`
- Required columns are present in each register/table.
- `requirements-summary.md` uses allowed authority classes only.

### Integration-style checks

- Every `GOLD-*` idea has a related `RISK-*` row.
- Every gold idea appears exactly once in the promotion map above.
- Future ADR candidates reference related idea IDs.
- Existing workstreams are mapped in both README and closeout.

### E2E trace check

Trace example: `GOLD-006`

`v0.5 ContextPacket planning/package map -> prototype-gold-register GOLD-006 -> agent-native gap GAP-001/GAP-006 -> splice risk RISK-006 -> closeout outcome promote to future ADR -> future ADR candidate ADRC-002`.

Pass result: the idea has evidence, clinical value, risk treatment, and exactly one final promotion outcome.

### Observability / governance checks

This closeout names unresolved questions, decision owners, ADR-needed items, PRD/issue items, prototype-evidence items, rejections, and deferred/open questions.

## Stop condition result

Met for docs-only rescue review:

- artifacts exist under `.scratch/pi-chart-rebase-rescue-review/`;
- every rescued idea has exactly one promotion-map outcome;
- existing workstreams are explicitly mapped;
- unresolved questions have named owners;
- this pass made no intentional source/schema/fixture/package/accepted-ADR/patient-data changes.

Next executable lane should be **ADR/PRD drafting**, not pi-chart implementation. Recommended first lane: ADRC-001 plus ADRC-002, because north-star wording and ContextPacket/ContextReceipt semantics constrain every later pi-chart rebase decision.

## Verification command record

Run after drafting artifacts on 2026-05-06:

- `find .scratch/pi-chart-rebase-rescue-review -type f | sort` listed all nine required files.
- Guard greps for direct hidden-source paths, direct-agent accepted-write tokens, product certification phrases, and stale event-shape authority patterns produced no output.
- `python3` exact-once check passed for 13 rescued ideas: `GOLD-001` through `GOLD-013` each appears exactly once in the closeout promotion map.
- `python3` required-column spot checks passed for all register artifacts.
- `python3` authority-class check passed for `requirements-summary.md`.
- `python3` idea-risk consistency check passed: every gold idea has a corresponding risk row.

`git status --short` shows this workstream as untracked under `.scratch/pi-chart-rebase-rescue-review/`. The working tree also contains unrelated pre-existing/parallel-session changes outside this directory; they were not modified by this docs-only rescue pass.
