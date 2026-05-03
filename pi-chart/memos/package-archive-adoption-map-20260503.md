# V0.5 Package Archive Adoption Map

Date: 2026-05-03
Status: Phase 0 planning memo; planning artifact only; no implementation authority.
Primary sources:
- `.omx/specs/deep-interview-v0-5-spec.md`
- `.omx/package-archive/v0-5-discovery-packages/MANIFEST.md`
- `pi-chart/memos/v0-5-spec-prep-synthesis-20260503.md`
- `pi-chart/memos/v0-5-roadmap-conventions-and-gates-20260503.md`
- `pi-chart/memos/adr-numbering-reconciliation-20260503.md`

## 1. Purpose

This memo maps the archived V0.5 discovery packages into the repo-visible planning sequence. It tells future PRD and test-spec authors which package materials are adopted, deferred, rejected, or renamed at the planning level.

This memo does not promote any package ADR into an accepted repo ADR. It does not authorize source, schema, fixture, package, lockfile, backend, runtime, or package-archive edits.

## 2. Authority rules

- Package artifacts are north-star research inputs, not accepted repo decisions.
- Package-internal labels such as "accepted", "implementation pending", issue backlog status, or PRD status are preserved as metadata only.
- Accepted repo ADRs live only under `pi-chart/docs/adr/` and use repo-local numbering.
- Package citations MUST use the package namespace, for example `pkg-018:plans/prd-018a-claim-kernel-and-compat.md §3`.
- TypeScript-like fragments in package docs and the synthesis are planning sketches, not implementation schemas.
- Future PRDs/test-specs MUST include their own adopt/defer/reject table and MUST NOT copy this map as implementation authority.

## 3. Package archive inventory

Source zip checksums from `.omx/package-archive/v0-5-discovery-packages/MANIFEST.md`:

| Package label | Source zip | SHA-256 | Extracted root | Planning role |
| --- | --- | --- | --- | --- |
| `pkg-018` | `pi-chart-rebase-package.zip` | `63b8cda172a1ee14e658b0964eaa772e6f0159367fd2b88f9d5b3090c64a8edc` | `.omx/package-archive/v0-5-discovery-packages/extracted/pi-chart-adr-018-package/` | Claim, predicate, bitemporal ledger research. |
| `pkg-019` | `pi-chart-context-engineering-package.zip` | `b4603811bee90b88935bb656208effe3c895dc83879cc969ad7f868f15c8663d` | `.omx/package-archive/v0-5-discovery-packages/extracted/pi-chart-adr-019-context-engineering-package/` | TaskFrame, ContextPacket, context receipt research. |
| `pkg-022` | `pi-chart-access-plane-package.zip` | `46179d55ee25ed21974937c81865c9e8f76d1359bffc8e09d741f4f0c593e11b` | `.omx/package-archive/v0-5-discovery-packages/extracted/pi-chart-adr-022-pi-chart-access-plane-package/` | Read/index plane, MCP, capture/review, role policy research. |
| `pkg-023` | `pi-chart-adr-023-pi-agent-runtime-shape-package.zip` | `3743a1513cdc1ff399f366644ba709c8a8bb666dce46a6d11b0baa8a5470a9a4` | `.omx/package-archive/v0-5-discovery-packages/extracted/pi-chart-adr-023-pi-agent-runtime-shape-package/` | Pi-agent runtime, sandbox grants, typed-output proposal research. |
| `pkg-024` | `pi-chart-adr-024-pi-orchestrator-package.zip` | `1428b0882b7c5af5afb2a687de644d9ed75711ee5985911ce7e67d1b2f6534a8` | `.omx/package-archive/v0-5-discovery-packages/extracted/pi-chart-adr-024-pi-orchestrator-package/` | Worklist, playbook, lease, attempt, reconciliation research. |

## 4. Package-to-phase map

| Package | Phase placement | Dependency stance | PRD/test-spec instruction |
| --- | --- | --- | --- |
| `pkg-018` | Phase 1 primary input; Phase 1.5 deferral bucket for relation/range/migration extras. | Phase 1 depends on Phase 0 conventions, ADR numbering, and this map. | Use the K0-K6 kernel spine only for first PRD/test-spec. |
| `pkg-019` | Phase 2 primary input; Phase 2.5 deferral bucket for compression. | Depends on Phase 1 claim IDs, hashes, and query-time semantics. | Treat ContextPacket as content-addressed artifact; decide receipt naming before predicate freeze. |
| `pkg-022` | Phase 3A for read-only index/access; Phase 3B for ContextPacket-aware MCP, capture, review, audit. | Phase 3A depends on Phase 1; Phase 3B depends on Phase 2 and 3A. | Keep Phase 3A read-only; keep capture/review out of Phase 3A. |
| `pkg-023` | Phase 4 primary input. | Depends on ContextPacket or explicit-query binding plus role-scoped MCP. | Add runtime cancellation before Phase 5 relies on terminal-work cancellation. |
| `pkg-024` | Phase 5 primary input; Phase 6+ for dashboard/control-plane and wakeup integration. | Depends on Phase 3A worklist projection, Phase 3B review/audit, and Phase 4 cancellation/runtime contracts. | Keep orchestration policy-bound; reject auto-accept and direct clinical writes. |

Deferred-items labels such as Phase 1.5 and Phase 2.5 are scope-control buckets, not named phases or PRDs until explicitly promoted.

## 5. `pkg-018` — claim, predicate, bitemporal ledger

Source anchors:
- `pkg-018:decisions/018-kernel-predicate-bitemporal-ledger.md`
- `pkg-018:plans/prd-018a-claim-kernel-and-compat.md`
- `pkg-018:plans/prd-018b-predicate-registry-and-validation.md`
- `pkg-018:plans/prd-018c-bitemporal-ledger-and-integrity.md`
- `pkg-018:plans/prd-018d-query-and-relation-migration.md`

| Treatment | Package material | Phase | Reason |
| --- | --- | --- | --- |
| Adopt | Four `ClaimShape` values; store-assigned `accepted_at`/`seq`; canonicalization string; content hash; append-only ledger entry; `validAt`/`knownAt` read minimum. | Phase 1 | Smallest substrate that lets later context/access/runtime packages bind to stable claims. |
| Defer | `inputs[]`; relation claims; revision modes beyond `corrects`; `validFrom`/`validTo`; predicate reference extraction; full migration. | Phase 1.5 bucket | Too broad for first kernel proof and requires predicate/relation decisions. |
| Reject for Phase 1 | One-shot migration as required first substrate; signatures/key management. | Phase 1 | Adds unnecessary risk before a tiny synthetic kernel proof exists. |
| Rename | None at Phase 1. | N/A | Naming concerns appear in `pkg-019` context receipt work. |

## 6. `pkg-019` — TaskFrame, ContextPacket, context receipt

Source anchors:
- `pkg-019:decisions/019-context-engineering.md`
- `pkg-019:plans/prd-019a-task-frame-and-context-packet.md`
- `pkg-019:plans/prd-019b-context-compiler-and-issuance.md`
- `pkg-019:plans/prd-019c-context-ledger-memory-proof-and-replay.md`
- `pkg-019:plans/prd-019d-safety-obligations-concern-projections.md`
- `pkg-019:plans/prd-019e-compression-fixtures-and-closeout.md`

| Treatment | Package material | Phase | Reason |
| --- | --- | --- | --- |
| Adopt | TaskFrame; ContextPacket; packet hash; original `(claim_id, claim_hash)` replay binding; context receipt claim referencing packet hash. | Phase 2 | Establishes bounded context handoff after claim hashes exist. |
| Defer | Compression; advanced concern/obligation/safety projections beyond a minimum safety floor. | Phase 2.5 bucket | Requires deterministic grammar and loss semantics. |
| Reject | Silent omission of mandatory safety-floor claims because of budget pressure. | Phase 2 | Safety floor must fail closed. |
| Rename | `act.memory_proof.v1` SHOULD become `act.context_receipt.v1` unless Phase 2 records a stronger rationale. | Phase 2 | "Proof" overstates the artifact; receipt better matches replayable handoff. |

## 7. `pkg-022` — access plane, MCP, capture pipeline

Source anchors:
- `pkg-022:decisions/022-pi-chart-access-plane.md`
- `pkg-022:plans/prd-022a-index-plane-and-sync.md`
- `pkg-022:plans/prd-022b-clinical-mcp-gateway.md`
- `pkg-022:plans/prd-022c-capture-router-and-proposal-review.md`
- `pkg-022:plans/prd-022d-role-scoped-tool-policy-and-audit.md`
- `pkg-022:plans/prd-022e-deployment-privacy-and-closeout.md`

| Treatment | Package material | Phase | Reason |
| --- | --- | --- | --- |
| Adopt | Read-only indexes; hash verification; freshness/status; deterministic rebuild; version-pinned embeddings. | Phase 3A | Gives agents and users query surfaces without write/capture risk. |
| Adopt later | ContextPacket-aware MCP; capture artifacts; proposed claims; review/rejection; tool audit. | Phase 3B | Requires Phase 2 context semantics and Phase 3A read/index base. |
| Defer | Capture-router complexity beyond proposal/review minimum. | Phase 3B+ | Predicate tiers and review routing belong in the PRD/spec that owns capture behavior. |
| Reject | Generic `append_claim` for agents; semantic search as evidence; non-local/non-BAA PHI path; capture-as-append. | Phase 3A/3B | Preserves clinical safety, auditability, and evidence boundaries. |
| Rename | None at Phase 0. | N/A | Tool/API names remain PRD-owned. |

## 8. `pkg-023` — pi-agent runtime shape

Source anchors:
- `pkg-023:decisions/023-pi-agent-runtime-shape.md`
- `pkg-023:plans/prd-023a-workspace-and-behavior-specs.md`
- `pkg-023:plans/prd-023b-episodes-sessions-and-event-stream.md`
- `pkg-023:plans/prd-023c-sandboxed-tools-and-grants.md`
- `pkg-023:plans/prd-023d-typed-output-and-claim-proposals.md`
- `pkg-023:plans/prd-023e-mcp-client-ui-observability-and-closeout.md`

| Treatment | Package material | Phase | Reason |
| --- | --- | --- | --- |
| Adopt | Workspace/behavior hashing; ContextPacket or explicit-query binding; sandbox tool grants; typed outputs as proposals only. | Phase 4 | Defines bounded runtime identity and output posture. |
| Add | `episode.cancel(reason)` or equivalent external cancellation API. | Phase 4 | Phase 5 orchestration needs terminal-work cancellation. |
| Defer | MCP client UI and broad observability closeout beyond minimum audit surface. | Phase 4+ | Avoids UI/control-plane expansion before runtime contracts exist. |
| Reject for V0.5 clinical path | Direct flue dependency; direct chart filesystem access; behavior/session/transcript as patient memory; network-by-default grants. | Phase 4 | Preserves chart boundary and patient-memory authority. |
| Rename | None at Phase 0. | N/A | Runtime type names are PRD-owned. |

## 9. `pkg-024` — orchestrator, worklist, playbook

Source anchors:
- `pkg-024:decisions/024-pi-orchestrator.md`
- `pkg-024:plans/prd-024a-clinical-work-items-and-worklist.md`
- `pkg-024:plans/prd-024b-clinical-playbooks.md`
- `pkg-024:plans/prd-024c-work-leases-and-dispatch.md`
- `pkg-024:plans/prd-024d-work-attempts-and-reconciliation.md`
- `pkg-024:plans/prd-024e-reasoning-bundles-audit-and-closeout.md`
- `pkg-024:plans/council-source-024/03-primitive-matrix.md`

| Treatment | Package material | Phase | Reason |
| --- | --- | --- | --- |
| Adopt later | Ledger-derived work items; playbooks as policy not ontology; WorkLease/WorkAttempt; ReasoningBundle; reconciliation; cancellation. | Phase 5 | Requires read/index, review/audit, and runtime cancellation contracts first. |
| Defer | Dashboard/control plane; wakeup/ADR 020 integration; broad concurrency/resource model beyond PRD acceptance criteria. | Phase 6+ or Phase 5 risk section | Too broad or policy-heavy for substrate-first V0.5 work. |
| Reject | Auto-accept; orchestrator-authored domain clinical claims; raw chart filesystem mount; shell hooks; direct EHR/order mutation. | Phase 5 | Orchestrator must coordinate proposals and review, not author clinical truth directly. |
| Rename | ReasoningBundle MUST reference ContextPacket by hash/path, not copy packet contents as a second context substrate. | Phase 5 | Prevents duplicate context authority. |

## 10. Backend posture and predicate tiers

Backend posture and predicate tiers are deferred to owning PRD/spec artifacts, not silently dropped.

- Phase 1 may define only the predicate-registry hooks needed for the claim-ledger kernel.
- Phase 3A/3B own access, backend adapter, PHI, read/index, capture, and audit details.
- Phase 3B and Phase 5 own capture/review routing and playbook predicate-policy cross-checks.
- Full backend architecture, including any OpenBrain-like adapter model, is not a Phase 0 blocker.
- Phase 1 assumes generated synthetic/local fixtures and no committed on-disk patient directory for the kernel proof.

## 11. Cross-package seams to carry forward

Future PRDs/test-specs MUST address or explicitly defer relevant synthesis contradictions:

| Seam | Carry-forward requirement |
| --- | --- |
| C1 claim revisions vs context replay | Phase 2 replay binds to original claim hash and reports drift. |
| C2 canonical hash vs embeddings | Phase 3A fixes render-kind registry and embedding-space versioning. |
| C3 `memory_proof` naming | Phase 2 decides receipt naming before predicate freeze. |
| C4 safety floor vs budget | Phase 2 fails closed on mandatory safety omissions. |
| C5 tool policy vs `predicatesAllowed` | Phase 5 validates role tool policy against playbook predicate permissions. |
| C6 behavior hash unenforced | Phase 4 defines pause/cancel/review behavior on behavior-hash changes. |
| C7 ReasoningBundle packet copy | Phase 5 references packet by hash/path, no duplicate packet copy authority. |
| C8 orchestrator cancellation needs runtime API | Phase 4 adds cancellation API before Phase 5 uses it. |
| C9 predicate registry expressiveness | Phase 1.5 decides registry extension versus code-side validation. |
| C10 query range mismatch | Phase 2 decides valid-range support or documents point-query downgrade. |

## 12. Acceptance checklist for next PRD/test-spec authors

Before drafting any V0.5 PRD/test-spec from package material, verify:

- [ ] The package source is cited with `pkg-NNN:` labels.
- [ ] The PRD/test-spec says package artifacts are research inputs, not accepted repo decisions.
- [ ] The adoption table includes adopt, defer, reject, and rename rows where relevant.
- [ ] The artifact states dependency gates and phase placement.
- [ ] Relevant C1-C10 seams are addressed or explicitly deferred.
- [ ] Backend posture and predicate tiers are placed in the owning PRD/spec, not treated as Phase 0 decisions.
- [ ] Type fragments are labeled as planning sketches, not implementation schemas.
- [ ] No source, schema, fixture, package, lockfile, or package-archive edit is bundled with planning.

## 13. Delta from synthesis

| Topic | Synthesis stance | This memo stance | Reason | Approval |
| --- | --- | --- | --- | --- |
| Five package inventory | All five packages must be present. | Same; all five packages listed with source zips, checksums, and extracted roots. | Artifact 3 acceptance criterion. | Planning memo only. |
| Package authority | Package artifacts are north-star research, not repo decisions. | Same, with explicit citation and namespace rules. | Prevent package ADR promotion by implication. | Planning memo only. |
| Backend posture | Deferred to owning PRD/spec artifacts. | Same. | Not a Phase 0 blocker. | Planning memo only. |
| Predicate tiers | Deferred to owning PRD/spec artifacts. | Same. | Avoid premature Phase 0 freeze. | Planning memo only. |
| Adoption summaries | Use synthesis adopt/defer/reject/rename rows. | Same, reorganized by package and phase. | Gives PRD authors a direct map. | Planning memo only. |

## 14. Non-goals

- No source-code implementation.
- No schema changes.
- No fixture changes.
- No `package.json` or lockfile changes.
- No package archive edits, re-zipping, extraction, checksum changes, or package-source rewriting.
- No accepted ADR promotion.
- No Phase 1 PRD/test-spec drafting in this memo.
- No backend, PHI, predicate-tier, runtime, or orchestrator policy freeze beyond the placement rules above.
