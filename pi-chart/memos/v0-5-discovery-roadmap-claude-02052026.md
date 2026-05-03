# V0.5 pi-chart Discovery Roadmap — Claude Parallel Pass

- Date: 2026-05-02
- Source of truth: `.omx/specs/deep-interview-v0-5-spec.md`
- Strategic frame: `.omx/specs/deep-interview-strategic-direction.md`
- Codex parallel artifact: `.omx/plans/v0-5-pi-chart-discovery-roadmap.md`
- Package extraction working dir: `/tmp/pi-rn-zip-inspect/` (sources `~/Downloads/pi-chart-*.zip`)
- Status: **discovery only — no source/schema/lockfile/branch/folder changes**

---

## 0. Why this artifact exists alongside the codex draft

The codex `$ralplan` artifact is structurally complete: scope lock, principles, options, phase roadmap, dependency map, risk register, ADR, staffing plan. It is the reference. **This document is intentionally non-redundant.** It exists to:

1. Make the **per-package primitive shapes** concrete in one place (codex described intent; this surfaces the actual proposed types).
2. Surface **cross-package contradictions** the dependency map glosses over.
3. Sharpen **adversarial findings** the codex draft summarized at the table-row level (especially council-report-022-opus and council-source-024).
4. Disagree with codex where warranted, in particular on: ADR-numbering urgency, predicate tiering as a cross-cutting decision (not a Phase-1 sub-question), and the exact gating between Phase 3A index work and the orchestrator.
5. Give the user a **diff-ready synthesis surface** (Section 9) so the merge with codex is mechanical, not interpretive.

Use both artifacts together. Where they agree, the answer is high-confidence. Where they disagree, Section 9 names each delta.

---

## 1. Package primitive snapshots (extracted, not paraphrased)

These are the actual shapes the package PRDs commit to. Codex's draft cites the packages by intent; this section makes the type surface visible so later PRD/test-spec work can be checked against it.

### 1.1 ADR 018 — claim envelope, predicate registry, ledger entries

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
    accepted_at: string;   // store-assigned
    seq: number;            // store-assigned, monotonic
    batch_id?: string;
  };
  actor:    { id: string; role: string; kind?: "human"|"agent"|"system"|"device"; run_id?: string };
  activity?: { kind: "import"|"observe"|"infer"|"order"|"perform"|"communicate"|"review"|"attest"|"normalize"|"extract"|"summarize"|"transcribe"|"migrate"; tool?: string; version?: string; run_id?: string; channel?: string };
  inputs?:  ClaimRef[];
  revises?: Array<{ target: ClaimRef; mode: "corrects"|"supersedes"|"withdraws"|"amends"; rationale?: string }>;
  integrity: { canonicalization: "jcs-rfc8785-pi-chart-v1"; hash: string; signature?: string };
};

type LedgerClaimEntry = {
  entry_version: "pi-chart.ledger.claim.v1";
  seq: number; accepted_at: string; batch_id: string;
  record_kind: "claim"; record: Claim;
  record_hash: string; prev_entry_hash: string | null; entry_hash: string;
};

type QueryTime = { validAt?: string; validFrom?: string; validTo?: string; knownAt?: string };
```

Hard invariants the package commits to: `shape ∈ four`; `accepted_at`, `seq` store-assigned; `integrity.hash` equals canonical record hash; ledger `prev_entry_hash` chained; `revises[]` non-cyclic; canonicalization fixed at `jcs-rfc8785-pi-chart-v1`.

### 1.2 ADR 019 — TaskFrame, ContextPacket, compile/memory-proof claims

```ts
type TaskFrame = {
  id: string; profile_version?: string; role: string; task: string;
  subject: string; encounter_id?: string;
  scope: { predicates?: string[]; threads?: string[];
           time_horizon?: { back?: string; forward?: string };
           evidence_depth?: number };
  budget: { max_claims?: number; max_tokens?: number; must_include_predicates?: string[] };
  stale_after?: string;
};

type ContextPacket = {
  packet_id: string; packet_hash: string;
  task_frame: TaskFrame; query_time: QueryTime;
  compiled_at: string; compiler: { id: string; version: string };
  included: Array<{ claim_id: string; claim_hash: string; reason: InclusionReason; role?: "primary"|"context"|"safety" }>;
  projections: { open_obligations?; safety_surface?; concern_threads?; uncertainty? };
  omissions:   Array<{ rule: OmissionRule; count: number; sample_claim_ids?: string[] }>;
  compression: Array<{ method: string; source_claim_ids: string[]; output: unknown; loss_estimate: "low"|"medium"|"high" }>;
  budget_consumed: { claims: number; tokens?: number };
  signature?: string;
};

// Two predicates carry packet provenance into the ledger:
type CompileEventObject  = { packet_id; packet_hash; task_frame; query_time; compiler; stats; artifact? };
type MemoryProofObject   = { packet_hash; compile_claim_id; consumer; purpose; received_at };
```

Key invariant: **packet is not a claim**, it is a content-addressed artifact. The ledger holds `act.context_compile.v1` and `act.memory_proof.v1` claims that *reference* the packet hash. Replay uses the original recipe and must not accept new `knownAt`/`validAt`.

### 1.3 ADR 022 — index plane, MCP tools, capture pipeline

Index tables (selected): `claim_index`, `claim_render_embedding`, `entity_index`, `claim_relation`, `context_packet_index`. Access-plane-only state: `capture_artifact`, `proposed_claim`, `tool_audit`, `agent_episode`, `role_tool_policy`.

MCP tool surface (≤12 in v1):

| Class | Tools |
|---|---|
| Read | `read_current_state`, `read_evidence_chain`, `read_safety_surface`, `read_open_obligations`, `read_timeline`, `search_claims_semantic` |
| Context | `compile_context`, `issue_context`, `replay_context` |
| Audit | `read_tool_audit`, `read_agent_episode` |
| Admin | `index_status`, `index_rebuild` (operator only) |

Hard rejections: generic `append_claim` not exposed to agents; semantic search returns `(claim_id, claim_hash, similarity)` only and is never evidence; OpenRouter excluded for any PHI path; deterministic rebuild mandatory; capture is not append.

### 1.4 ADR 023 — workspace, episode, sandbox, typed proposal

```ts
type PiAgentWorkspace = { root: string; agents: Record<string, AgentBehaviorSpec>;
                          skills: SkillSpec[]; roles: RoleBehaviorSpec[] };

type PiAgentEpisode = {
  episodeId: string; patientId?: string; taskFrameId: string;
  contextPacketHash?: string; explicitQueryRef?: string;
  roleId: string; actorId: string; activityId: string;
  behaviorSpecHashes: string[]; knownAt: string;
  status: "running"|"completed"|"failed"|"aborted";
};

type SandboxToolGrant = {
  grantId: string; episodeId: string;
  tool: "bash"|"read"|"write"|"edit"|"grep"|"glob";
  plane: "repo_workspace"|"artifact_workspace"|"agent_development";
  pathAllowlist: string[]; network: "none"|"allowlisted"|"site_internal";
  expiresAt: string;
};

type TypedOutputProposal = {
  proposalId; episodeId; patientId; predicate; object;
  contextPacketHash?; explicitQueryRef?;
  validation: { schema; predicate; evidence; rolePolicy };  // each: pending|passed|failed
  status: "draft"|"pending_review"|"accepted"|"rejected";
};
```

Council decision on `flue` (the upstream agent runtime considered as a dep): **partially adopt as reference shape, reject as dependency**. No dissent on the split.

### 1.5 ADR 024 — orchestrator primitives

```ts
type ClinicalWorkItem = {
  workItemId; patientId;
  source: "ledger_obligation"|"pending_review"|"watch_alert"|"external_adapter_snapshot";
  sourceClaim: { patientId; claimId; hash };
  predicate; state; priority; dueAt?; validAt?; knownAt; requiredRole;
  blockedBy: Array<{ workItemId; sourceClaim: ClaimRef; terminal: boolean }>;
};

type ClinicalPlaybook = {
  playbookId; trigger: { source; predicates };
  activeStates; terminalStates; agentRole; reviewerRole;
  predicatesAllowed: string[];
  requiresContextPacket: true;          // mandatory
  maxPacketAgeSeconds; maxTurns; stallThresholdSeconds;
  autoAccept: false;                    // mandatory false in v1
  concurrency: { global; perPatient; perRole? };
  recompileOnSafetyEvent; escalation: Record<string, string>;
};

type WorkLease   = { leaseId; workItemId; playbookHash; contextPacketHash;
                     status: "leased"|"running"|"retry_queued"|"released";
                     leasedAt; expiresAt };
type WorkAttempt = { attemptId; leaseId; agentEpisodeId; phase; packetHash;
                     bundleId; proposedClaimRefs; error? };
type ReasoningBundle = { bundleId; workItemId; patientId;
                         playbookHash; packetHash; rootPath; sanitizedKey;
                         retentionClass: "ephemeral"|"audit_until_review"|"policy_managed";
                         files: { metadata; packet; scratchDir; draftsDir; transcript; workpad } };
```

15 enforced invariants, the most load-bearing being I-ORCH-01 (ledger-derived only), I-ORCH-03 (no attempt without fresh packet), I-ORCH-07 (`autoAccept: false`), I-ORCH-08 (orchestrator authors no clinical claims), I-ORCH-11 (scheduler state rebuildable from ledger).

---

## 2. Phase ordering — independent recommendation

This section converges with the codex draft on most phases; deltas are flagged with **Δ-CLAUDE**.

```
Phase 0   Discovery scaffold + package archive + cross-cutting decisions   (current)
Phase 1   Claim-ledger kernel substrate                                    (ADR 018-derived)
Phase 2   ContextPacket + memory provenance                                (ADR 019-derived)
Phase 3A  Read-only index plane + hash-verification trust root             (ADR 022 P1-P4)
Phase 3B  Capture/proposal pipeline + role-scoped MCP                      (ADR 022 P5-P7)
Phase 4   pi-agent runtime boundary                                        (ADR 023-derived)
Phase 5   Worklist orchestration + playbooks                               (ADR 024-derived)
Phase 6   Cross-cutting governance (021 PHI, 020 triggers, ADR promotion)
```

### Deltas vs codex

- **Δ-CLAUDE-1: Phase 0 owns predicate tiering.** Codex defers tiering ("safety-tier vs low-risk predicates") into per-phase questions. My read of all five packages says tiering is cross-cutting: 018's predicate registry shape, 022's capture/review routing, 023's typed-output review gates, and 024's `predicatesAllowed` per playbook all assume tiers exist but no package defines them. Decide tiers in Phase 0, before Phase 1 PRD work, because the registry shape depends on it.
- **Δ-CLAUDE-2: Phase 3A precedes Phase 5 *prerequisites*, not just Phase 4.** Codex maps orchestration to depend on runtime, runtime on access plane. But ADR 024's I-ORCH-01 ("ledger-derived work only") only works if there is a reliable index that *projects* obligations from the ledger. Without Phase 3A's `read_open_obligations` MCP, "ledger-derived worklist" is incoherent — the ledger contains predicates, not work items. Make this dependency explicit so Phase 5 PRDs cannot precede Phase 3A.
- **Δ-CLAUDE-3: ADR-numbering reconciliation goes in Phase 0, not Phase 6.** The accepted repo ADR `pi-chart/decisions/018-architecture-rebase-clinical-truth-substrate.md` already exists. Every package PRD in 018/019/022/023/024 cites its own ADR number. Pushing the rename/renumber decision to Phase 6 will create months of doc rot. Pick a scheme now (proposal: package ADRs become 050-series in `.omx/package-archive/` until promotion; new accepted ADRs continue from 019 in `pi-chart/decisions/`).
- **Δ-CLAUDE-4: PHI policy (ADR 021) gates Phase 3B, not Phase 6.** Council finding 13.4 (OpenRouter rejection) is a hard configuration constraint. For a local-only V0.5, Phase 3A can ship without 021. But Phase 3B's capture router stages real PHI in `proposed_claim` rows and eventually in `tool_audit`. Without retention/redaction policy decided, Phase 3B is blocked. Move 021 dependency forward.
- **Δ-CLAUDE-5: Phase 1 substrate is smaller than 018a-d together.** ADR 018's package proposes 25 issues across four PRDs. The first PRD/test-spec should target a strict subset: claim type + canonicalization + content hash + minimal append-only ledger + bitemporal read with `validAt`/`knownAt` only (no `validFrom`/`validTo`). Defer relations, the predicate registry's reference-extraction logic, and revision modes other than `corrects` to a Phase 1.5.

---

## 3. Cross-package contradictions and seams

These are the issues the dependency-map view hides. Each is a future PRD/spec hazard.

| # | Seam | Conflict | Resolution candidate |
|---|---|---|---|
| C1 | 018 `revises[]` vs 019 `replayContext` | ADR 018 lets a claim be revised (corrects/supersedes/withdraws/amends). ADR 019 `replayContext` requires "matching compiler version" but says nothing about *claim version*. If a packet referenced a claim that has since been revised, does replay use the original `claim_hash` (yes per packet binding) or the latest revision (no — but is it surfaced)? | Phase 2 PRD must specify: replay binds to `(claim_id, claim_hash)` from packet; revisions visible only via a separate "drift report." |
| C2 | 018 single canonicalization vs 022 multi-render embeddings | ADR 018 fixes one canonicalization. ADR 022's `claim_render_embedding` table keys on `render_kind` — implying multiple renders of the same claim. Renders are not canonical. Embeddings could split across renderings; semantic-search relevance becomes render-dependent. | Phase 3A PRD must declare exactly which renders are indexed and treat `render_kind` as a registry-fixed enum, not free-form. |
| C3 | 019 "memory proof" terminology | Package extractor flagged this independently: `act.memory_proof.v1` records *receipt*, not *authenticity proof*. The packet hash is integrity-checkable only because the ledger is append-only — the "proof" claim itself adds nothing cryptographic. Misleading name will cause downstream agents to over-trust. | Phase 0 cross-cutting: rename to `act.context_handoff.v1` (or `act.context_receipt.v1`) before Phase 2 PRD freezes the predicate. |
| C4 | 019 safety floor under-specified | If `task_frame.budget.must_include_predicates = ["allergy"]`, patient has 50 allergies, `max_claims = 10` — does compile (a) include all 50 (violating budget), (b) fail closed, or (c) include 10 + record 40 as safety-omitted? Test E3 leaves (c) ambiguous. | Phase 2 PRD must pick: recommend (b) fail-closed with structured `safety_floor_violation` claim, never (a) or (c). |
| C5 | 022 `role_tool_policy` vs 024 `predicatesAllowed` | Two parallel permission systems: ADR 022 gates which *tools* a role can call; ADR 024 gates which *predicates* a playbook may produce. Nothing says they must be consistent. A playbook can `predicatesAllowed: ["intent.medication"]` while the bound role lacks the MCP tool to write it. | Phase 5 PRD must add: playbook validator cross-checks `predicatesAllowed` against `role_tool_policy` for `agentRole`; reject playbook on mismatch. |
| C6 | 023 behavior-spec hashing without enforcement | Episode records `behaviorSpecHashes[]`. But there is no rule that a behavior change *invalidates* prior episodes or *requires* re-review of in-flight ones. Hash is recorded then ignored. | Phase 4 PRD: episodes mid-flight at the time of behavior-spec change must be paused for review or auto-cancelled. |
| C7 | 024 `ReasoningBundle` carries `packet.json` | If the bundle stores a copy of the packet (not a symlink/reference into ledger storage), it becomes a second context substrate. Diverges from ADR 019's "packet is content-addressed artifact in pi-chart-core." | Phase 5 PRD: bundles must reference packets by hash + immutable storage path; no in-bundle copy. |
| C8 | 023 + 024 cancellation contract | ADR 024 I-ORCH-05 says terminal sources cancel running attempts. ADR 023 has no symmetric "external cancel" hook on `PiAgentEpisode`. Cancellation requires a runtime API not in the 023 surface. | Add to Phase 4 PRD: `episode.cancel(reason)` API and behavior; ADR 024 depends on it. |
| C9 | 018 predicate registry depth | Registry declares `references` at JSON-path level with `ref_kind` enum. No union types, no cardinality, no exclusivity. A `fulfillment` relation requires "exactly one intent and one action" — registry can't express it. | Phase 1 (after kernel) or Phase 1.5 PRD: extend predicate definition with cardinality + exclusivity, or accept that some relation validation lives in code. |
| C10 | 018 `validAt`/`validFrom`/`validTo` vs 019 `validAt` only | ADR 018 query contract has all three. ADR 019 packet `query_time` has only `validAt` + `knownAt`. Range-validity claims (e.g., a med order valid 6h) cannot be packet-scoped accurately. | Phase 2 PRD: extend `query_time` to include `validRange` or document that range queries downgrade to point queries at `validAt`. |

---

## 4. Cross-cutting decisions (Phase 0 outputs)

These should be decided *before* Phase 1 PRD work begins. Each is a small artifact, not code.

### 4.1 Predicate tiering

Three tiers, with implications across packages:

- **Tier S — safety/clinical-truth predicates.** Allergies, contraindications, code status, anaphylaxis history, identity. Cannot be agent-authored without human review. Drives 022 capture-router routing, 023 typed-proposal hard gate, 024 `predicatesAllowed` exclusion list.
- **Tier C — clinical-context predicates.** Notes, summaries, observations not requiring single-clinician attestation. Agent may propose; operator/clinician review required pre-accept.
- **Tier O — operational/metadata predicates.** `act.context_compile.v1`, `act.memory_proof.v1`, `act.tool_invocation.v1`, audit-only. Agent and system may author directly.

Phase 0 deliverable: a `predicate-tier-policy.md` memo + a list of seed predicates per tier. This is one short document, not a system.

### 4.2 ADR numbering reconciliation

Decision options:

- **A.** Keep package ADR numbers (018-024) inside `.omx/package-archive/`, never promote. New repo ADRs continue from 019 onward in `pi-chart/decisions/`. Package docs treated as research, not authority.
- **B.** Renumber package ADRs to a 050-series before any partial promotion.
- **C.** Wait until first promotion, then renumber.

Recommendation: **A.** It costs nothing, is reversible, and creates no doc rot. Codex draft pushes this to Phase 6 — earlier is better.

### 4.3 PHI and deployment posture for V0.5

Decide one-line policy: **V0.5 is local-only; no hosted backends, no cloud embeddings, no non-BAA model providers.** Document. Add a config-time check (planned, not built) that refuses to start the index/MCP services if they are pointed at non-local backends. This makes Phase 3A safe to build without ADR 021 fully written; Phase 3B still needs 021.

### 4.4 Roadmap → spec → slice → coding pipeline (codex agrees)

Same as codex Section 7. No disagreement. Mentioned here only because Phase 0 closes by stating the pipeline.

---

## 5. Phase 1 first-issue decomposition (planning sketch only)

Codex names "Phase 1 likely PRD/test-spec" but stops short of issue shapes. This is the smallest viable kernel slice — to be authored as a PRD next, not as code now.

| # | Issue shape | Acceptance | Blocks |
|---|---|---|---|
| K0 | Decide canonicalization fixed string `jcs-rfc8785-pi-chart-v1`; document field exclusion (`integrity.hash`, `integrity.signature`) | Doc only | K1 |
| K1 | Define `Claim` type minimum (`id`, `shape`, `predicate`, `subject`, `object`, `time.{valid,recorded_at,accepted_at,seq}`, `actor`, `integrity`); no `inputs[]`, no `revises[]` yet | Type compiles; JSON schema validates a fixture; no legacy `EventEnvelope` reference | K2, K4 |
| K2 | Implement canonicalization helper + `record_hash` computation | Tests: order-invariant; sensitive to value change; excludes self-reference fields | K3 |
| K3 | Implement append-only ledger entry write (`LedgerClaimEntry` with `prev_entry_hash`/`entry_hash`) | Tests: seq monotonic; chain valid; mutation detected; head matches | K5 |
| K4 | Predicate registry minimum: load registry, validate `shape` matches, validate `object` against schema | Tests: unknown predicate rejected; shape mismatch rejected; object schema applied | K6 |
| K5 | Read path with `QueryTime = { validAt?, knownAt? }` minimum (no `validFrom`/`validTo`) | Tests: backdated correction not visible before `accepted_at`; `knownAt` filters | (Phase 2) |
| K6 | Smallest fixture corpus: one patient, one encounter, four claims (one per shape), one revision | Migration fixture exists; deterministic; documented | (closeout) |

Out of Phase 1 scope (defer to Phase 1.5):
- `revises[]` modes other than `corrects`
- `inputs[]` relation claims
- Predicate `references` extraction
- Range-validity (`validFrom`/`validTo`)
- Migration of the current `pi-chart` `EventEnvelope` ledger (use a fresh patient corpus instead)
- Signature / key management

The Phase 1 PRD should use the existing `pi-chart/src/types.ts` `EventEnvelope` only as a conceptual reference. The user's strategic spec and CLAUDE.md "current code is non-binding evidence" both apply.

---

## 6. Risk register additions (delta vs codex Section 6)

Codex's risk table is solid. Additions surfaced from the deep-reads:

| Risk | Source | Why codex missed it | Attack plan |
|---|---|---|---|
| Two parallel permission systems (022 tools vs 024 predicates) drift apart | C5 above | Dependency map shows 024→022, hides asymmetry | Playbook validator cross-checks; Phase 5 PRD requirement |
| Embedding model migration is non-atomic | 022 council 13.3 + 13.17 | Codex mentioned index drift but not the mid-migration mixed-space hazard | Phase 3A must commit to either full re-embed before any read switches, or version-pinned reads |
| Memory-proof terminology over-promises | C3 | Codex inherited package's framing | Rename predicate before Phase 2 PRD freeze |
| Safety-floor / budget conflict ambiguity | C4 | Codex listed safety-floor risk generically | Phase 0 decision: fail-closed |
| Behavior-spec hash recorded but unenforced | C6 | Codex listed runtime risk generically | Phase 4 PRD: cancel-or-pause in-flight episodes |
| ReasoningBundle becomes second context substrate | C7 | Codex listed orchestrator-as-second-truth at the worklist level only | Phase 5 PRD: bundles reference packet by hash, never copy |
| Council "smallest viable slice" guidance buried | 022 council 13.15 | Codex mentioned phasing 022 into A/B but did not cite the council's 9-issue minimum | Use as Phase 3A PRD scope-cap |
| Predicate registry has no cardinality/exclusivity | C9 + ADR 018 critique | Codex mentioned predicate-registry-as-too-thin in passing | Phase 1 or 1.5 decision: extend registry vs accept code-side relation validation |
| Episode cancellation contract missing | C8 | Cross-package gap | Phase 4 PRD: explicit `episode.cancel(reason)` API |
| Migration to V0.5 from current chart not addressed by package | ADR 018 critique 6 | Both packages and codex assume one-shot migration | V0.5 should ship with a fresh patient corpus and treat current `patients/` as legacy reference; defer migration to a Phase 6 ADR |

---

## 7. Brownfield evidence (current pi-chart, non-binding)

For Phase 1 PRDs the following current files are reference only:

- `pi-chart/src/types.ts` — defines `EventEnvelope`, `EventEnvelopeBase`, `ClinicalEvent`, `EventInput`. The four-shape `Claim` discriminated union does not exist.
- `pi-chart/src/write.ts` — append path; per-day NDJSON under `patients/<id>/timeline/<day>/events.ndjson`. No ledger entry, no chain hash, no batch.
- `pi-chart/src/read.ts` — patient-scoped reads with `asOf` semantics. No `validAt`/`knownAt` separation.
- `pi-chart/src/views/bundle.ts` — `contextBundle()` is a thin read-projection wrapper. Not a ContextPacket: no schema, no hash, no compiler version, no omission accounting.
- `pi-chart/src/validate.ts`, `schema.ts` — JSON-schema validation against `event.schema.json`, not a predicate registry.
- `pi-chart/decisions/` — accepted ADRs 001-018 already present. `018-architecture-rebase-clinical-truth-substrate.md` is unrelated to package-018 except in spirit. **Numbering conflict is real** (see §4.2).

None of these constrain V0.5 architecture. They are useful as fixture sources, test inspiration, and as evidence of which simplifications worked.

---

## 8. What to ignore in the packages

Packages contain a lot of material. Some of it should not survive into V0.5 PRDs:

1. **ADR 018 issue 018-21 "one-shot migration script."** Too risky for any non-toy corpus. V0.5 should not migrate; start fresh.
2. **ADR 019 compression sub-PRD (019e).** Compression is honest but the package gives no determinism spec (extracted critique: predicate-rollup grammar undefined). Ship Phase 2 *without* compression; add in Phase 2.5.
3. **ADR 022 capture router complexity.** Council itself recommended 9-issue minimum slice. Capture/proposal/review can wait until Phase 3B; do not over-design in Phase 3A.
4. **ADR 023 self-hosted-development plane.** Out of clinical scope for V0.5. Note as long-range north-star, do not specify in PRDs.
5. **ADR 024 dashboard, ADR 020 wakeup integration.** Codex correctly defers these. Reaffirm: not until Phase 6.
6. **All `.github/ISSUE_TEMPLATE/*-agent-issue.md` files.** Useful as future templates, not as authoritative scope. Treat as boilerplate.

---

## 9. Synthesis-prep diff table (codex ↔ this artifact)

For the user's downstream merge:

| Topic | Codex draft says | This artifact says | Recommended merge |
|---|---|---|---|
| Phase count | 6 + sub-phases (3A/3B) | 7 (Phase 0 explicit, 6 + 3A/3B) | Both; codex's "Phase 0" is implicit, name it |
| ADR numbering | Defer to Phase 6 | Decide in Phase 0 | Take this artifact's stance |
| PHI/021 dependency | Phase 6 | Phase 3B | Take this artifact's stance |
| Predicate tiering | Per-phase question | Phase 0 cross-cut | Take this artifact's stance |
| ADR 024 ledger-derived worklist | Sound, depends on Phase 1 kernel | Depends on Phase 3A index, not just kernel | Take this artifact's stance |
| Phase 1 kernel scope | Whole 018 package, sliced later | Strict K0–K6 subset (no relations, no `validFrom`/`validTo`) | Take this artifact's stance |
| Smallest 022 slice | Implicit | Council "9 issues" is the cap | Cite explicitly |
| Memory-proof claim name | Keep | Rename before Phase 2 freeze | Take this artifact's stance |
| Capture/review reviewer-role assignment | Mentioned generically | Underspecified — needs predicate-tier-driven router rules | Add to Phase 3B PRD scope |
| ReasoningBundle vs ContextPacket | Both surfaced | C7 contradiction — bundle copy of packet is a hazard | Take this artifact's stance |
| Behavior-hash enforcement | Not addressed | C6 contradiction — hash recorded but ignored | Take this artifact's stance |
| Episode cancel API | Not addressed | C8 — missing 023 surface | Take this artifact's stance |
| Concurrency-cap resource model | Not addressed | ADR 024 critique 6 — caps lack resource backing | Add to Phase 5 PRD risks |
| Embedding migration atomicity | Not addressed | ADR 022 critique — mid-migration mixed-space hazard | Add to Phase 3A PRD scope |
| Phase 1 first-issue list | Not provided | K0–K6 sketch | Take as starting point for next PRD |
| Staffing plan ($ralph/$team) | Detailed | Not addressed | Keep codex's Section 12 |
| Acceptance criteria for the roadmap itself | Detailed | Not addressed | Keep codex's Section 8 |
| Discovery-stage ADR | Detailed | Not addressed | Keep codex's Section 10 |
| Verification plan | Detailed | Not addressed | Keep codex's Section 9 |

The two artifacts are complementary. Codex provides the meta-layer (scope, options, ADR, staffing, verification). This artifact provides the substantive layer (primitives, contradictions, cross-cuts, first-issue decomposition).

---

## 10. Recommended next-stage pipeline

1. **Resolve Phase 0 cross-cuts** as four short memos under `pi-chart/memos/`:
   - `predicate-tier-policy-02052026.md` (§4.1)
   - `adr-numbering-reconciliation-02052026.md` (§4.2)
   - `v0-5-phi-deployment-posture-02052026.md` (§4.3)
   - `package-archive-manifest-02052026.md` — checksum + extraction map for the five zips
2. **Author Phase 1 PRD** at `.omx/plans/prd-v0-5-claim-ledger-kernel.md` using §5's K0–K6 as the issue spine. Cite `jcs-rfc8785-pi-chart-v1` decision and the brownfield evidence in §7.
3. **Author Phase 1 test-spec** at `.omx/plans/test-spec-v0-5-claim-ledger-kernel.md` mapping each ADR-018 invariant (V-KERNEL-01..03, V-TIME-02, V-INTEG-01..03, V-REL-02) to a fixture-backed test row.
4. **Run codex+claude+gemini parallel review** on the Phase 1 PRD/test-spec — same multi-model pattern as this discovery pass. The user's memory ("phased plans + multi-model review for UI/visual work") generalizes here.
5. **Issue-slice decomposition** *only after* PRD/test-spec accepted. Each issue should compile + test in under one coding session.
6. **Repeat for Phase 2**, then 3A, then 3B, etc. Do not skip the multi-model review at any phase boundary.

---

## 11. Provenance

- Package extractions: `Agent`-spawned per-package deep-reads on 2026-05-02. Every claim about a package primitive is sourced from the extracted package files at `/tmp/pi-rn-zip-inspect/`.
- Brownfield evidence: read directly from `pi-chart/src/` and `pi-chart/decisions/` on 2026-05-02.
- Codex draft compared against: `.omx/plans/v0-5-pi-chart-discovery-roadmap.md` (582 lines, status: draft for RALPLAN consensus review).
- This artifact is **independent**. It was not informed by codex's analysis during drafting. Section 9 is the diff produced after both existed.
