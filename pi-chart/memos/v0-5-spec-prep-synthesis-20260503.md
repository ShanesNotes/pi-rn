# V0.5 pi-chart Spec-Prep Synthesis Plan

Status: draft for RALPLAN consensus review
Generated: 2026-05-03
Primary source of truth: `.omx/specs/deep-interview-v0-5-spec.md`
Prior Codex roadmap: `.omx/plans/v0-5-pi-chart-discovery-roadmap.md`
Claude parallel pass: `pi-chart/memos/v0-5-discovery-roadmap-claude-02052026.md` (dated 2026-05-02)
Package archive: `.omx/package-archive/v0-5-discovery-packages/`
Context snapshot: `.omx/context/v0-5-spec-prep-synthesis-20260503T030541Z.md`

## 0. Purpose and Scope Lock

This artifact is the merge layer between:

- the **Codex meta-roadmap**: scope/options/ADR/staffing/verification; and
- the **Claude substantive pass**: primitive shapes, package contradictions, cross-cutting decisions, first kernel issue sketch, risk deltas, and mechanical merge table.

It prepares the project to draft package-derived spec/PRD/test-spec documents. It does **not** authorize implementation.

### In scope now

- Create one comprehensive spec-prep/adoption artifact that future spec authors can use directly.
- Preserve the prior Codex roadmap's scope lock, options, ADR, staffing, and verification posture.
- Adopt Claude's substantive additions where they strengthen the roadmap and do not violate the source spec.
- Make the Phase 0 cross-cutting decisions explicit before Phase 1 kernel PRD/test-spec drafting.
- Convert the Claude Section 9 diff into a concrete merge spine.
- Define spec-authoring templates and acceptance criteria for the next artifacts.

### Out of scope now

- No source-code implementation.
- No schema changes.
- No `package.json` or lockfile changes.
- No branch switch, branch rewrite, source relocation, implementation folder creation, or legacy deletion.
- No package ADR promotion into accepted repo ADR numbering.
- No final PRD/test-spec/issue-slice commitment beyond preparing the next drafting sequence.
- No claim that current `pi-chart` behavior binds V0.5.

### Non-binding reference banner

Current `pi-chart` code, tests, schemas, fixtures, and accepted ADRs are brownfield evidence only. Future V0.5 specs may cite them for examples, risks, fixture ideas, or successful simplifications, but must not treat them as binding architecture unless a specific behavior is re-justified inside that spec.

### Package-authority banner

Package-internal statuses such as "accepted", "implementation pending", issue backlogs, or PRD labels are preserved research metadata only. They are not accepted repo ADRs, not source-of-truth product commitments, and not permission to implement.

## 1. RALPLAN-DR Summary — Deliberate Mode

Deliberate mode is warranted because the planning surface includes clinical safety, PHI posture, agent writes, auditability, and long-lived architecture seams.

### Principles

1. **Spec first, code later** — this pass only prepares spec authoring; coding begins only after accepted PRD/test-spec/slice artifacts exist.
2. **Preserve package intent, reject package sprawl** — every package remains visible, but each future spec must choose a small subset and explicitly defer the rest.
3. **Resolve only true roadmap blockers before kernel PRD** — artifact visibility/conventions, ADR numbering, and package archive/adoption are Phase 0 blockers; backend posture and predicate tiers are PRD/spec decisions unless later evidence proves they block the roadmap itself.
4. **Truth before access, context before automation** — claim ledger integrity precedes ContextPacket, access plane, runtime, and orchestration; capture/write automation comes after review gates.
5. **Contradictions are design inputs** — cross-package seams C1-C10 are not trivia; each must become a spec decision, test row, or explicit deferral.

### Decision Drivers

1. **Spec-readiness:** package PRDs contain type fragments and assumptions that must be surfaced before spec authors draft from memory.
2. **Dependency integrity:** ADR 019/022/023/024 depend on claim refs, hashes, query-time semantics, and predicate policy from ADR 018 plus Phase 0 decisions.
3. **Safety and maintainability:** PHI, agent direct-write temptation, dual permission systems, and reasoning-bundle/context duplication must be constrained before implementation agents start.

### Viable Options

#### Option A — Keep Codex and Claude artifacts separate

- **Approach:** treat Codex roadmap and Claude pass as two companion references; do not merge.
- **Pros:** zero synthesis risk; preserves authorial separation.
- **Cons:** future spec authors must reconcile contradictions manually; Claude's Section 9 merge table remains unused; cross-cut decisions can be lost.

#### Option B — Mechanical merge into Codex roadmap only

- **Approach:** edit `.omx/plans/v0-5-pi-chart-discovery-roadmap.md` to incorporate Claude deltas.
- **Pros:** one canonical roadmap; preserves existing RALPLAN-approved artifact.
- **Cons:** the roadmap becomes too large and mixed-purpose; the prior artifact's meta-layer clarity is diluted; `.omx/` is ignored in normal git status.

#### Option C — Create a dedicated spec-prep synthesis artifact (recommended)

- **Approach:** keep prior Codex and Claude artifacts intact, create this new synthesis artifact that merges them specifically for spec drafting.
- **Pros:** preserves both inputs; gives spec authors one operational artifact; separates meta-roadmap from spec-prep details; makes merge deltas explicit and reviewable.
- **Cons:** introduces a third planning artifact; must clearly state authority hierarchy to avoid drift.

#### Option D — Draft Phase 1 PRD/test-spec immediately from Claude K0-K6

- **Approach:** skip synthesis and start the claim-ledger kernel PRD/test-spec now.
- **Pros:** fastest route to spec drafting.
- **Cons:** bypasses Phase 0 cross-cut decisions that Claude explicitly identified; risks freezing predicate names, ADR numbering, PHI assumptions, and permission tiers prematurely.

Recommended decision: **Option C**.

### Pre-mortem: 3 failure scenarios

1. **Spec bloat failure:** future authors copy whole package PRDs into V0.5 specs. Mitigation: every spec must include an adoption/defer/reject table and scope cap.
2. **Cross-cut freeze failure:** Phase 1 PRD freezes predicate, hash, or backend language before the relevant PRD/spec owns that decision. Mitigation: Phase 0 locks artifact authority/numbering/archive adoption, while backend posture and predicate tiers become explicit PRD/spec sections with delta tables.
3. **Safety boundary failure:** access/runtime/orchestrator specs allow agent-authored clinical claims because permission systems are reviewed in isolation. Mitigation: tool policy, predicate tiering, proposal/review, and playbook `predicatesAllowed` must be cross-checked in specs.

### Expanded planning verification plan

- **Unit-level artifact checks:** verify each next memo/PRD includes required sections, source refs, adoption/defer/reject rows, and reference-only banner.
- **Integration-level planning checks:** verify Phase 1 PRD depends on Phase 0 decisions; Phase 2 depends on Phase 1 hashes/query time; Phase 3B depends on Phase 2 and Phase 3A; Phase 5 depends on Phase 3A/3B/4.
- **E2E planning checks:** walk a candidate clinical work item from claim → context packet → read index → agent episode → proposed claim → orchestrator reconciliation and confirm no direct-write shortcut appears.
- **Observability/audit checks:** every spec that introduces runtime state must define audit artifact, retention class, rebuildability, and verification evidence.

## 2. Source Hierarchy and Merge Rules

### Authority hierarchy

1. Direct user instructions and AGENTS/developer/system constraints.
2. `.omx/specs/deep-interview-v0-5-spec.md`.
3. This synthesis artifact after Architect/Critic approval.
4. Prior Codex roadmap and Claude parallel memo as preserved inputs.
5. Package ADR/PRD/test/issues artifacts as research/north-star sources.
6. Current `pi-chart` implementation as non-binding evidence only.

### Merge rules

- If Codex and Claude agree, treat the point as high-confidence roadmap guidance.
- If Claude provides a concrete primitive/contradiction absent from Codex, include it as spec-prep detail unless it violates the source spec.
- If Claude disagrees with Codex on phase timing, adopt Claude only when the disagreement prevents doc rot, safety risk, or dependency ambiguity.
- If a package issue backlog over-specifies implementation, preserve it as a source but reduce it to spec questions and acceptance criteria.
- If current code conflicts with package direction, do not average them; record the conflict and keep current code reference-only.

## 3. Resolved Merge Spine from Claude Section 9

| Topic | Resolved stance | Action for next artifacts |
| --- | --- | --- |
| Phase count | Keep Codex Phase 0-6 shape; make Phase 3A/3B explicit and make Phase 0 a real artifact stage. | Specs must name their phase and dependencies. |
| ADR numbering | Move reconciliation to Phase 0. | Draft `adr-numbering-reconciliation-20260503.md` before accepted ADR promotion. |
| PHI/ADR 021 dependency | Do not make full backend posture a Phase 0 blocker. | Add backend/PHI posture sections to Phase 3A/3B/runtime/orchestrator PRDs; Phase 1 kernel stays synthetic/local. |
| Predicate tiering | Do not freeze a full tier taxonomy in Phase 0. | Phase 1 PRD defines only the registry hooks it needs; Phase 3B/5 specs own capture/review/playbook tier policy. |
| ADR 024 worklist | Phase 5 depends on Phase 3A read/index worklist projection, not just kernel. | Phase 5 PRDs cannot begin before Phase 3A semantics are specified. |
| Phase 1 kernel scope | Use strict K0-K6 subset; defer relations, range query, migration, advanced revisions. | Phase 1 PRD/test-spec must be small. |
| Smallest ADR 022 slice | Cite council's read-only minimum as Phase 3A cap. | Phase 3A PRD must remain read-only. |
| `act.memory_proof.v1` naming | Rename or decide before Phase 2 freeze. | Phase 0/2 decision row required; recommended `act.context_receipt.v1`. |
| Capture/review routing | Predicate-tier-driven router rules required. | Phase 3B PRD must bind capture routing to predicate tiers. |
| ReasoningBundle vs ContextPacket | Bundle copy of packet is a hazard. | Phase 5 spec must reference packet by hash/path, not copy it as a second substrate. |
| Behavior hash enforcement | Hash must have lifecycle effect. | Phase 4 PRD must define pause/cancel/review on behavior changes. |
| Episode cancellation | Missing ADR 023 surface. | Phase 4 PRD must define `episode.cancel(reason)` before Phase 5 can rely on cancellation. |
| Concurrency caps | Resource model missing. | Phase 5 PRD risk and acceptance criteria. |
| Embedding migration | Mixed embedding spaces are unsafe. | Phase 3A PRD must version-pin reads or require full re-embed before switch. |
| First issue list | Use K0-K6 as planning spine only. | Phase 1 PRD authors may adapt; do not implement from table alone. |
| Staffing/verification/ADR | Keep Codex sections. | Reuse for follow-up `$ralph`/`$team` launch hints. |

## 4. Package Primitive Adoption Register

This section captures primitive shapes as spec inputs. They are not implementation schemas yet.

Standalone-copy warning: if any subsection below is copied into a future PRD/test-spec, repeat that the TypeScript-like fragments are planning inputs and package-derived sketches, not implementation schemas or source-edit authorization.

### ADR 018 — claim, predicate, bitemporal ledger

Candidate primitive set:

```ts
type ClaimShape = "context" | "observation" | "interpretation" | "act";

type Claim = {
  id: string;
  shape: ClaimShape;
  predicate: string;
  subject: string;
  encounter_id?: string;
  object: unknown;
  time: {
    valid: { kind: "instant"; at: string } | { kind: "interval"; start: string; end?: string };
    recorded_at: string;
    accepted_at: string;
    seq: number;
    batch_id?: string;
  };
  actor: { id: string; role: string; kind?: "human" | "agent" | "system" | "device"; run_id?: string };
  activity?: { kind: string; tool?: string; version?: string; run_id?: string; channel?: string };
  inputs?: ClaimRef[];
  revises?: Array<{ target: ClaimRef; mode: "corrects" | "supersedes" | "withdraws" | "amends"; rationale?: string }>;
  integrity: { canonicalization: "jcs-rfc8785-pi-chart-v1"; hash: string; signature?: string };
};

type LedgerClaimEntry = {
  entry_version: "pi-chart.ledger.claim.v1";
  seq: number;
  accepted_at: string;
  batch_id: string;
  record_kind: "claim";
  record: Claim;
  record_hash: string;
  prev_entry_hash: string | null;
  entry_hash: string;
};

type QueryTime = { validAt?: string; validFrom?: string; validTo?: string; knownAt?: string };
```

Spec-prep adoption decision:

- **Adopt now for Phase 1 PRD:** four `ClaimShape` values, store-assigned `accepted_at`/`seq`, canonicalization string, content hash, append-only ledger entry, `validAt`/`knownAt` query minimum.
- **Defer to Phase 1.5:** `inputs[]`, relation claims, `revises[]` modes beyond `corrects`, `validFrom`/`validTo`, predicate reference extraction, full migration.
- **Reject for Phase 1:** one-shot migration as a required first substrate; signatures/key management.

### ADR 019 — TaskFrame, ContextPacket, context receipt

Candidate primitive set:

```ts
type TaskFrame = {
  id: string;
  profile_version?: string;
  role: string;
  task: string;
  subject: string;
  encounter_id?: string;
  scope: { predicates?: string[]; threads?: string[]; time_horizon?: { back?: string; forward?: string }; evidence_depth?: number };
  budget: { max_claims?: number; max_tokens?: number; must_include_predicates?: string[] };
  stale_after?: string;
};

type ContextPacket = {
  packet_id: string;
  packet_hash: string;
  task_frame: TaskFrame;
  query_time: QueryTime;
  compiled_at: string;
  compiler: { id: string; version: string };
  included: Array<{ claim_id: string; claim_hash: string; reason: string; role?: "primary" | "context" | "safety" }>;
  projections: Record<string, unknown>;
  omissions: Array<{ rule: string; count: number; sample_claim_ids?: string[] }>;
  compression: Array<{ method: string; source_claim_ids: string[]; output: unknown; loss_estimate: "low" | "medium" | "high" }>;
  budget_consumed: { claims: number; tokens?: number };
  signature?: string;
};
```

Spec-prep adoption decision:

- **Adopt for Phase 2:** packet as content-addressed artifact, not claim; ledger claims reference packet hash; replay binds to original compile recipe and original `(claim_id, claim_hash)`.
- **Rename before freeze:** `act.memory_proof.v1` over-promises. Recommended alternatives: `act.context_receipt.v1` or `act.context_handoff.v1`.
- **Defer:** compression until deterministic grammar exists; concern/obligation/safety projections beyond a minimum safety floor.
- **Fail-closed rule:** if mandatory safety predicates exceed budget, compile fails with a structured violation; it must not silently omit safety-floor claims.

### ADR 022 — access plane, MCP, capture pipeline

Candidate surfaces:

- Read/index tables: `claim_index`, `claim_render_embedding`, `entity_index`, `claim_relation`, `context_packet_index`.
- Access-plane state: `capture_artifact`, `proposed_claim`, `tool_audit`, `agent_episode`, `role_tool_policy`.
- MCP v1 read tools: `read_current_state`, `read_evidence_chain`, `read_safety_surface`, `read_open_obligations`, `read_timeline`, `search_claims_semantic`.
- MCP context/audit/admin tools: `compile_context`, `issue_context`, `replay_context`, `read_tool_audit`, `read_agent_episode`, `index_status`, `index_rebuild`.

Spec-prep adoption decision:

- **Phase 3A:** read-only index, hash verification, freshness/status, deterministic rebuild, version-pinned embeddings.
- **Phase 3B:** ContextPacket-aware MCP, capture artifacts, proposed claims, review/rejection, tool audit.
- **Hard rejects:** generic `append_claim` for agents, semantic search as evidence, non-local/non-BAA PHI path, capture-as-append.

### ADR 023 — pi-agent runtime shape

Candidate primitive set:

```ts
type PiAgentEpisode = {
  episodeId: string;
  patientId?: string;
  taskFrameId: string;
  contextPacketHash?: string;
  explicitQueryRef?: string;
  roleId: string;
  actorId: string;
  activityId: string;
  behaviorSpecHashes: string[];
  knownAt: string;
  status: "running" | "completed" | "failed" | "aborted";
};

type SandboxToolGrant = {
  grantId: string;
  episodeId: string;
  tool: "bash" | "read" | "write" | "edit" | "grep" | "glob";
  plane: "repo_workspace" | "artifact_workspace" | "agent_development";
  pathAllowlist: string[];
  network: "none" | "allowlisted" | "site_internal";
  expiresAt: string;
};

type TypedOutputProposal = {
  proposalId: string;
  episodeId: string;
  patientId: string;
  predicate: string;
  object: unknown;
  contextPacketHash?: string;
  explicitQueryRef?: string;
  validation: Record<"schema" | "predicate" | "evidence" | "rolePolicy", "pending" | "passed" | "failed">;
  status: "draft" | "pending_review" | "accepted" | "rejected";
};
```

Spec-prep adoption decision:

- **Adopt:** workspace/behavior hashing as bounded runtime identity; ContextPacket or explicit-query binding; sandbox tool grants; typed outputs as proposals only.
- **Add missing contract:** `episode.cancel(reason)` / external cancellation API before ADR 024 relies on terminal-work cancellation.
- **Reject for V0.5 clinical path:** direct flue dependency, direct chart filesystem access, behavior/session/transcript as patient memory, network-by-default grants.

### ADR 024 — orchestrator/worklist/playbook

Candidate primitive set:

```ts
type ClinicalWorkItem = {
  workItemId: string;
  patientId: string;
  source: "ledger_obligation" | "pending_review" | "watch_alert" | "external_adapter_snapshot";
  sourceClaim: { patientId: string; claimId: string; hash: string };
  predicate: string;
  state: string;
  priority: string;
  dueAt?: string;
  validAt?: string;
  knownAt: string;
  requiredRole: string;
  blockedBy: Array<{ workItemId: string; sourceClaim: ClaimRef; terminal: boolean }>;
};

type ClinicalPlaybook = {
  playbookId: string;
  trigger: { source: string; predicates: string[] };
  activeStates: string[];
  terminalStates: string[];
  agentRole: string;
  reviewerRole: string;
  predicatesAllowed: string[];
  requiresContextPacket: true;
  maxPacketAgeSeconds: number;
  maxTurns: number;
  stallThresholdSeconds: number;
  autoAccept: false;
  concurrency: { global: number; perPatient: number; perRole?: number };
  recompileOnSafetyEvent: boolean;
  escalation: Record<string, string>;
};
```

Spec-prep adoption decision:

- **Adopt later:** ledger-derived work items, playbooks as policy not ontology, WorkLease/WorkAttempt, ReasoningBundle, reconciliation, cancellation.
- **Hard dependency:** Phase 5 needs Phase 3A worklist/read projection plus Phase 4 cancellation API.
- **Hard rejects:** auto-accept, orchestrator-authored domain clinical claims, raw chart filesystem mount, shell hooks, direct EHR/order mutation.

## 5. Phase 0 Durable Artifact Queue

Phase 0 should lock roadmap visibility and handoff hygiene, not prematurely decide backend architecture or predicate tiers. Backend posture and predicate tiers remain important, but they belong in the PRD/specs that introduce backend adapters, capture/review routing, or predicate registry semantics.

### Artifact 1 — Roadmap conventions and handoff standards

Path: `pi-chart/memos/v0-5-roadmap-conventions-and-gates-20260503.md`

Required content:

- Date format: headers use `YYYY-MM-DD`; filename suffix uses `YYYYMMDD` only when needed; reject `DDMMYYYY` going forward.
- Artifact location authority: `.omx/` as Codex/RALPLAN working area; durable project-visible planning in `pi-chart/docs/planning/v0.5/`; architect memos/mirrors in `pi-chart/memos/`; accepted ADRs in `pi-chart/decisions/`.
- Citation format for brownfield, package, and cross-spec references.
- Delta-table requirement for future PRDs/test-specs.
- RFC2119 gate language.
- Telos/attention rule: stale context is evidence, not authority; newer user corrections and engineering judgment govern placement.

Acceptance criteria:

- Records L1-L6 commitments or defers them explicitly.
- States no source/schema/package implementation until Phase 0 durable artifacts plus Phase 1 PRD/test-spec pass Architect+Critic.
- States dirty-tree disposition for unrelated work.

### Artifact 2 — ADR numbering reconciliation

Path: `pi-chart/memos/adr-numbering-reconciliation-20260503.md`

Recommended stance:

- Package ADR numbers remain archival identifiers inside `.omx/package-archive/`.
- Accepted repo ADR numbers continue from current `pi-chart/decisions/` sequence.
- Kernel ADR becomes `pi-chart/decisions/019-v0-5-claim-ledger-kernel.md` if/when accepted.
- If a package concept is promoted, it receives a new accepted repo ADR number and cites the package source.

Acceptance criteria:

- Names the existing conflict with `pi-chart/decisions/018-architecture-rebase-clinical-truth-substrate.md`.
- Defines package citation convention.
- Prevents future PRDs from claiming package ADRs are accepted repo ADRs.

### Artifact 3 — Package archive adoption map

Path: `pi-chart/memos/package-archive-adoption-map-20260503.md`

Required content:

- Source zip names and checksum source from `.omx/package-archive/v0-5-discovery-packages/MANIFEST.md`.
- Extracted package roots.
- Package-to-phase mapping.
- Adopt/defer/reject/rename summaries from this artifact.
- Explicit note that backend posture and predicate tiers are deferred to owning PRD/spec artifacts, not silently dropped.

Acceptance criteria:

- All five packages present.
- Warns that package artifacts are north-star research, not promoted repo decisions.
- Cites this synthesis and the source spec.

### Deferred into PRD/specs, not Phase 0

- **Backend posture:** Phase 1 kernel assumes generated synthetic/local fixtures only; backend architecture belongs in access/runtime PRDs and must surface OpenBrain-like adapter questions there.
- **Predicate tiers:** Phase 1 may define registry hooks and seed examples, but full safety/context/operational tier policy belongs where capture/review/playbook behavior is specified.

## 6. Canonical Phase Order for Spec Drafting

```text
Phase 0   Discovery scaffold + visible conventions + ADR numbering + package archive adoption
Phase 1   Small claim-ledger kernel substrate (ADR 018-derived K0-K6 only)
Phase 2   ContextPacket + context receipt + replay/drift semantics
Phase 3A  Read-only index plane + hash verification + freshness/status
Phase 3B  Context-aware MCP + capture/proposal/review + audit
Phase 4   pi-agent runtime boundary + cancellation + proposal validation
Phase 5   Worklist orchestration + playbooks + reconciliation
Phase 6   Trigger/wakeup, full PHI/retention/deployment, promotion/migration governance
```

Phase 6 handles broad governance and hosted deployment; backend posture is introduced only in the PRD/specs that need backend adapters or real PHI.

Dependency assertions:

- Phase 1 must not depend on current `EventEnvelope` migration.
- Phase 2 depends on claim refs, hashes, and `validAt`/`knownAt` semantics.
- Phase 3A depends on Phase 1, but not all of Phase 2.
- Phase 3B depends on Phase 2 and Phase 3A.
- Phase 4 depends on ContextPacket or explicit query binding plus role-scoped MCP.
- Phase 5 depends on Phase 3A worklist projection, Phase 3B review/audit, and Phase 4 cancellation/runtime contracts.
- Deferred-items labels such as Phase 1.5 or Phase 2.5 are not named phases yet; they are scope-control buckets until a later PRD promotes them.
- Phase 6 resolves what remains too broad or policy-heavy for safe V0.5 substrate work.

## 7. Cross-Package Contradiction Matrix for Spec Authors

| ID | Seam | Conflict | Required spec action |
| --- | --- | --- | --- |
| C1 | Claim revisions vs context replay | Replay must bind to original `claim_hash`, not latest revision. | Phase 2 spec adds drift report semantics. |
| C2 | Canonical hash vs multiple render embeddings | Embedding render choice can alter search results. | Phase 3A spec fixes `render_kind` registry and versioned embedding spaces. |
| C3 | `memory_proof` naming | Receipt is not cryptographic proof. | Decide rename before Phase 2 predicate freeze. |
| C4 | Safety floor vs budget | Mandatory safety claims may exceed packet budget. | Phase 2 spec fails closed on safety-floor violation. |
| C5 | Tool policy vs `predicatesAllowed` | Role may have tools inconsistent with playbook predicates. | Phase 5 playbook validator cross-checks role tool policy and predicate tiers. |
| C6 | Behavior hash unenforced | Hash recorded but behavior changes do not affect episodes. | Phase 4 spec defines pause/cancel/review on behavior hash changes. |
| C7 | ReasoningBundle packet copy | Bundle can become second context substrate. | Phase 5 spec references packet by hash/path, no duplicate packet authority. |
| C8 | Orchestrator cancellation needs runtime API | ADR 024 requires cancellation that ADR 023 lacks. | Phase 4 spec adds cancellation API before Phase 5. |
| C9 | Predicate registry expressiveness | Cardinality/exclusivity cannot express relation invariants. | Phase 1.5 decides registry extension vs code-side validation. |
| C10 | Query range mismatch | ADR 018 has `validFrom`/`validTo`, ADR 019 often uses `validAt`. | Phase 2 either adds `validRange` or documents point-query downgrade. |

These rows must be reviewed during PRD/test-spec drafting. A future spec can defer a contradiction, but must not ignore it.

## 8. Phase 1 Kernel K0-K6 Drafting Spine

The Phase 1 PRD/test-spec should start from this narrow spine. It is planning-only, not an issue list ready for coding.

| ID | Spec slice | Draft acceptance target | Blocks |
| --- | --- | --- | --- |
| K0 | Canonicalization decision | Document `jcs-rfc8785-pi-chart-v1`; define fields excluded from hash (`integrity.hash`, `integrity.signature`). | K1 |
| K1 | Minimal `Claim` type | Type/schema covers `id`, `shape`, `predicate`, `subject`, `object`, `time`, `actor`, `integrity`; no `EventEnvelope` dependency. | K2, K4 |
| K2 | Canonicalization/hash helper | Tests planned for order-invariance, value sensitivity, self-reference exclusion. | K3 |
| K3 | Append-only ledger entry | Tests planned for monotonic `seq`, valid chain, mutation detection, head hash. | K5 |
| K4 | Predicate registry minimum | Tests planned for unknown predicate rejection, shape mismatch, object schema validation. | K6 |
| K5 | Minimal bitemporal read | `QueryTime = { validAt?, knownAt? }`; tests planned for backdated correction visibility. | Phase 2 |
| K6 | Tiny fixture corpus | One patient, one encounter, four claims, one correction; deterministic and documented. | Closeout |

Phase 1 explicit deferrals:

- `inputs[]` and relation claims.
- Revision modes other than `corrects`.
- Predicate reference extraction.
- `validFrom`/`validTo` range queries.
- Migration of current `patients/` data.
- Signatures/key management.
- Agent accepted writes.

## 9. Spec Authoring Template

Every future V0.5 PRD/test-spec/spec artifact should include the following sections.

### Required PRD sections

1. **Reference-only banner** — current `pi-chart` is evidence only.
2. **Source package anchors** — exact package docs used.
3. **Adoption table** — adopt / defer / reject / rename.
4. **Dependency gates** — upstream artifacts required before coding.
5. **Primitive surface** — type fragments or schema sketches, marked non-final until implementation.
6. **Acceptance criteria** — testable and small enough for coding agents.
7. **Contradiction coverage** — relevant C1-C10 rows addressed.
8. **Security/PHI/audit posture** — even if "not applicable", state why.
9. **Out-of-scope list** — package material deliberately not adopted.
10. **Verification plan** — unit/integration/e2e/observability appropriate to phase.

### Required test-spec sections

1. **Fixture inventory** — synthetic/reference data only unless PHI policy allows more.
2. **Invariant rows** — each package invariant mapped to a test or explicit deferral.
3. **Negative tests** — mutation, stale context, forbidden tool, omitted safety claim, or equivalent.
4. **Replay/rebuild tests** — when context/index/orchestrator state appears.
5. **Boundary tests** — no direct append, no cross-patient access, no package authority leak.
6. **Traceability matrix** — PRD requirement → test row → source package/spec.

## 10. Package Material to Ignore or Defer

| Package area | Treatment | Rationale |
| --- | --- | --- |
| ADR 018 one-shot migration script | Defer/reject for V0.5 Phase 1 | Too risky and not needed for clean substrate proof. |
| ADR 018 full relation migration | Defer to Phase 1.5 | Requires predicate cardinality/exclusivity decisions. |
| ADR 019 compression PRD | Defer to Phase 2.5 | Deterministic grammar and loss semantics under-specified. |
| ADR 022 capture router complexity | Defer to Phase 3B | Phase 3A must stay read-only. |
| ADR 023 self-hosted development plane | Long-range only | Not clinical V0.5 substrate. |
| ADR 024 dashboard/control plane | Defer to Phase 6+ | Requires PHI/retention/deployment policy. |
| ADR 024 wakeup/ADR 020 integration | Defer to Phase 6 | Trigger evaluator boundary not ready. |
| `.github/ISSUE_TEMPLATE/*` package files | Preserve as template examples only | Not authoritative scope. |
| Current `EventEnvelope` migration | Defer | Use fresh synthetic corpus for kernel proof. |

## 11. Risk Register Additions to Carry Forward

| Risk | Phase | Mitigation in future spec |
| --- | --- | --- |
| Dual permission systems drift | 3B/5 | Cross-check role tool policy, predicate tiers, and playbook `predicatesAllowed`. |
| Mixed embedding spaces during migration | 3A | Version-pin reads or require full re-embed before index switch. |
| Context receipt over-trusted as proof | 2 | Rename and document what it proves and does not prove. |
| Safety-floor/budget ambiguity | 2 | Fail closed with structured violation. |
| Behavior hash ignored | 4 | Pause/cancel/review in-flight episodes after behavior change. |
| ReasoningBundle duplicates packet authority | 5 | Reference packet by hash/path only. |
| Predicate registry lacks cardinality | 1.5 | Decide registry extension or code-side validation. |
| Episode cancellation missing | 4 | Add runtime cancellation surface. |
| Current chart migration assumed | 1/6 | Fresh corpus for V0.5; migration later. |
| PHI retention undefined | 3B+ | Local-only posture now; full ADR 021 before capture/runtime/orchestration with real PHI. |
| Package ADR status leaks into accepted repo docs | 0 | Numbering memo and package-authority banner. |
| Worklist inferred without index | 5 | Phase 5 depends on Phase 3A projection. |

## 12. Next-Stage Artifact Sequence

Do not draft Phase 1 PRD/test-spec until the Phase 0 durable artifact queue is done or explicitly superseded.

Date suffix note: headers use `YYYY-MM-DD`; filename suffixes use `YYYYMMDD` only when needed. Existing `02052026` filenames are legacy and should not be repeated.

1. `pi-chart/memos/v0-5-roadmap-conventions-and-gates-20260503.md`
2. `pi-chart/memos/adr-numbering-reconciliation-20260503.md`
3. `pi-chart/memos/package-archive-adoption-map-20260503.md`
4. `.omx/plans/prd-v0-5-claim-ledger-kernel.md`
5. `.omx/plans/test-spec-v0-5-claim-ledger-kernel.md`
6. Multi-agent/multi-model review of Phase 1 PRD/test-spec.
7. Issue-slice decomposition only after PRD/test-spec approval.

## 13. Acceptance Criteria for This Synthesis Artifact

- Incorporates Codex roadmap meta-layer and Claude substantive layer without overwriting either input.
- Records explicit authority hierarchy and merge rules.
- Resolves Claude Section 9 deltas into a concrete action table.
- Includes package primitive adoption register for ADR 018/019/022/023/024.
- Moves artifact conventions, ADR numbering, and package archive/adoption into Phase 0 while deferring backend posture and predicate tiers to owning PRD/specs.
- Includes contradiction matrix C1-C10 with required spec action.
- Includes K0-K6 kernel drafting spine and explicit Phase 1 deferrals.
- Provides PRD/test-spec authoring template.
- Provides next-stage artifact sequence.
- Preserves no-implementation boundary.

## 14. Verification Plan for This Pass

- Confirm this artifact exists in `.omx/plans/` and optionally mirrored to `pi-chart/memos/`.
- Confirm prior Codex and Claude artifacts remain unchanged.
- Confirm no source/schema/package-lock files were modified by this pass. The broader workspace may already contain unrelated dirty files; verification should distinguish "no implementation edits by this pass" from "repo is clean."
- Confirm package archive still has five source zips, five extracted roots, and passing checksums.
- Run Architect review, then Critic review sequentially.
- Apply review amendments and record changelog.

## 15. ADR for the Spec-Prep Synthesis Decision

### Decision

Create a dedicated V0.5 spec-prep synthesis artifact that preserves the prior Codex roadmap and Claude memo as inputs while resolving their deltas into a single spec-authoring runway.

### Drivers

- The user wants to take time on a crucial step before drafting package-adopted spec documents.
- Claude's pass surfaces concrete package primitives and contradictions that the Codex meta-roadmap intentionally did not expand.
- The project needs Phase 0 cross-cutting decisions before a small Phase 1 kernel PRD/test-spec can be clean.

### Alternatives considered

- Keep artifacts separate — rejected because future spec authors would re-merge manually.
- Rewrite Codex roadmap — rejected because the roadmap's meta-layer is already useful and approved.
- Draft Phase 1 PRD immediately — rejected because Phase 0 cross-cuts would be skipped.

### Why chosen

A dedicated synthesis artifact gives spec authors one comprehensive guide while preserving the source documents and preventing accidental implementation creep.

### Consequences

- The planning artifact set grows by one file.
- Future specs have stronger up-front constraints and less room for package sprawl.
- Phase 1 PRD/test-spec is delayed until four short Phase 0 memos are drafted or explicitly waived.

### Follow-ups

1. Finalize this artifact after Architect/Critic approval.
2. Mirror/distill approved planning into project-visible artifacts under `pi-chart/memos/` and `pi-chart/docs/planning/v0.5/`.
3. Draft the three Phase 0 durable artifacts.
4. Draft Phase 1 PRD/test-spec from K0-K6 only.

## 16. Available Agent Types Roster

Known useful roles for follow-up:

- `explore` — repo/package lookup and file mapping.
- `planner` — memo/PRD/test-spec sequencing.
- `architect` — architecture boundaries, dependencies, contradiction resolution.
- `critic` — acceptance/testability/risk gate.
- `analyst` — hidden requirements and edge cases.
- `test-engineer` — test-spec and fixture strategy.
- `security-reviewer` — PHI, tool policy, trust boundaries.
- `writer` — durable memos/spec drafts.
- `verifier` — completion evidence and scope-boundary checks.
- `executor` — only after PRD/test-spec approval; not used for source code in this planning pass.

## 17. Follow-up Staffing Guidance

### `$ralph` sequential path

Use for one memo at a time or the Phase 1 PRD/test-spec once Phase 0 is complete.

Suggested launch:

```bash
$ralph "Using .omx/plans/v0-5-spec-prep-synthesis.md, draft pi-chart/memos/predicate-tier-policy-02052026.md only. Planning artifact only; no source/schema/package edits. Do not treat type fragments in the synthesis as implementation schemas."
```

### `$team` parallel path

Use only if the Phase 0 artifacts are split among lanes after the conventions note is stable; serial `$ralph` is preferred because the artifacts cross-reference.

Suggested launch:

```bash
$team "Using .omx/plans/v0-5-spec-prep-synthesis.md, draft the remaining Phase 0 V0.5 artifacts: ADR numbering reconciliation and package archive/adoption map. Planning artifacts only; no source/schema/package edits. Do not treat type fragments in the synthesis as implementation schemas."
```

Suggested lanes:

- `architect` high: ADR numbering and package promotion boundary.
- `planner` medium: conventions/dependency mapping.
- `writer` high: package archive/adoption map.
- `verifier` high: ensure no implementation edits and all memos cite source hierarchy.

Team verification path:

1. Each lane reports artifact path and scope-boundary evidence.
2. Leader checks each memo against acceptance criteria in Section 5.
3. Verifier confirms no source/schema/package-lock edits.
4. Critic reviews memos as a set before Phase 1 PRD begins.

## 18. Review Changelog

- Draft synthesized from `.omx/specs/deep-interview-v0-5-spec.md`, `.omx/plans/v0-5-pi-chart-discovery-roadmap.md`, `pi-chart/memos/v0-5-discovery-roadmap-claude-02052026.md`, and package archive context.
- Architect review: APPROVE with non-blocking wording tightenings.
- Applied Architect tightenings: clarified Phase 3B real-PHI dependency on ADR 021-class answers; added Tier O PHI/audit/role-policy warning; added launch-prompt warning that type fragments are not implementation schemas.
- Critic review: APPROVE with no blocking issues.
- Applied Critic non-blocking improvements: added dirty-tree caveat to verification plan; documented date suffix convention; repeated the type-fragment non-schema warning at the package primitive adoption register.

- Post-alignment update: backend posture and predicate tiers moved out of Phase 0 artifact queue and into owning PRD/specs; Phase 0 now locks conventions/visibility, ADR numbering, and package archive adoption.
