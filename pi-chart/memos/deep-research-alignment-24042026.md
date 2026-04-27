# Deep-research report alignment matrix + plan — 2026-04-24

**Status:** operational plan for pi-chart's next lane, pending operator
direction. Supersedes the Turn-0 seven-turn workflow.

**Source report:** `memos/deep-research-report24042026.md`
**Purpose:** Turn 1 of the operationalization pass — map every material
recommendation in the report against current repo state, classify, collapse
the workflow into concrete workstreams (§10), and name the next lane (§11).

**Revision note (2026-04-24, post-operator review):** Initial draft was too
permissive on "shipping" / "no-op" classifications for cases where the
direction is accepted but the proof is not yet built. Several rows tightened
below. Turn-0 seven-turn workflow collapsed into four workstreams A–D with
Workstream A (memory-proof projection over the six-surface broad EHR
skeleton) named as the next plan-mode target.

---

## Scope rules

- Repo-local claims classified against README, DESIGN, ARCHITECTURE, ROADMAP,
  v0.3 memo, ADRs 001–011, ADR 015, ADR 016, and `clinical-reference/broad-ehr-skeleton.md`.
- Accepted ADRs treated as settled — no re-litigation.
- External claims (standards, OSS patterns) marked `external-unverified`;
  dispositions are research prompts, not decisions.
- "Shipping" requires **both** accepted direction AND demonstrated proof
  (code + fixture + validation); "planned" is the classification when direction
  is accepted but the proof surface does not yet exist.

---

## Bucket + disposition legend

- **Bucket:** `shipping`, `partial-shipping` (substrate exists; proof surface
  missing), `planned` (named in ADR/memo/roadmap but not built),
  `new` (not yet named in repo), `stale`, `contradicted`, `external-unverified`.
- **Disposition:** `no-op`, `docs-alignment`, `ADR-candidate`, `plan-candidate`
  (lane for a concrete implementation plan), `ticket-candidate`,
  `research-prompt`, `defer`.
- **Confidence:** H/M/L.

---

## 1. Executive thesis

| # | Claim | Repo evidence | Bucket | Disposition | Conf | Notes |
|---|---|---|---|---|---|---|
| T1 | Chart canonical; current state is a query; derived disposable | README core thesis; DESIGN §1 §0-invariant; invariant 3 | shipping | no-op | H | Report restating repo thesis. |
| T2 | Pi-chart remains substrate, not OSS EHR / generic agent framework | ADR 016 §Context/Decision/Alternatives; README growth path | shipping | no-op | H | Already accepted direction. |
| T3 | Differentiator = provenance-native memory layer with strong standards boundaries | DESIGN §1, §5.7, §8 invariants (internal); ADRs 010/011 (internal); no FHIR/AuditEvent/Provenance emit adapter, no external integration tests | partial-shipping | ADR-candidate (standards boundary) | H | **Corrected from no-op.** Internal provenance is strong. External standards boundary is named "later" and has no code. The differentiator only holds when the external seam exists. |
| T4 | Primitives promising; interoperability/operational surface "ahead" | ROADMAP "Later/speculative"; seams table | shipping | no-op | M | Report inference aligns with roadmap self-assessment. |

## 2. Must-have next

| # | Recommendation | Repo evidence | Bucket | Disposition | Conf | Notes |
|---|---|---|---|---|---|---|
| M1 | Finish six-surface broad EHR skeleton around one coherent patient story | ADR 016 §Decision (six surfaces verbatim); `clinical-reference/broad-ehr-skeleton.md` §"First fixture sequence sketch" explicitly states `patient_001` is still narrow respiratory-decompensation seed and does **not** yet satisfy the broad skeleton; ROADMAP "Current focus" | planned | **plan-candidate** | H | **Corrected from shipping/no-op.** Direction accepted; proof fixture does not exist. This is the main build lane. |
| M2 | Make actor, attestation, review state first-class | DESIGN §1.1 source.kind registry + `author.role`; v0.3 memo §7.1 attestation (unauthored ADR 014); ROADMAP "Deferred primitives" row | planned | ADR-candidate | H | Memo §7.1 detailed spec; ADR 014 not authored. Review/rejection state is less covered than cosign — worth flagging. |
| M3 | Ship real FHIR boundary adapter (11 resources listed in report) | ROADMAP "Later/speculative"; DESIGN §10; ARCHITECTURE §3.2 | planned | research-prompt (scoping) | M | **Corrected from ADR-candidate.** Not ready for ADR. Needs research on minimum viable resource set (report's 11 is too large a commitment without scoping). |
| M4 | Deterministic projection and replay exports as formal API / exportable artifact | ADR 016 §Verification #3 (memory proof projection); `clinical-reference/broad-ehr-skeleton.md` §"Memory proof projection outline"; v0.3 memo §5.4 `contextBundle` sketch with `fingerprint` | planned | **plan-candidate (highest leverage)** | H | **Elevated.** This is the lane that turns ADR 016 into a testable product proof. Pairs with M1 — same workstream. |
| M5 | Harden external evidence references (stable IDs for imports, docs, lab interfaces, monitor feeds, agent-generated derivations) | ADR 010 `EvidenceRef` `kind: external`; ADR 011 transform + `transform.input_refs`; ADR 015 Tier 1 row: migration script + `patient_001` corpus sweep landed on `0.3.0-partial` | partial-shipping | ticket-candidate (adapter/import fixture work) | H | **Corrected.** Substrate shipped; Phase 7 migration already landed per ROADMAP Tier 1 table. Hardening lives in future adapter/import fixtures, not a gate on anything now. |

## 3. Differentiating bets

| # | Recommendation | Repo evidence | Bucket | Disposition | Conf | Notes |
|---|---|---|---|---|---|---|
| D1 | "Chart once, project many" as flagship capability | DESIGN §4 six view primitives; ADR 016 verification #4 ("entered once, reused through projections") — **no fixture demonstrates this end-to-end yet** | partial-shipping | plan-candidate (pairs with M1/M4) | H | **Corrected from docs-alignment.** Capability primitives exist; the proof — one fixture where a bedside observation is reused across note, review, open-loops, handoff without re-entry — is unbuilt. |
| D2 | Evidence chains + open loops as first-class chart surfaces | DESIGN §4.5/§4.6; ADR 009 contested panels; ADR 015 phase 6 role threading; no demo/projection showing these as user-facing flagships | partial-shipping | plan-candidate (pairs with M4) | H | Same correction shape as D1 — capability exists, flagship demonstration does not. |
| D3 | Model uncertainty and contradiction directly | ADR 009 (contradicts + resolves); ADR 010 (typed EvidenceRef + 5 roles); ADR 011 (transform); ADR 015 phases 1–7 shipped per ROADMAP Tier 1 | shipping | no-op | H | Substrate direction shipped. |

## 4. Standards and interoperability

| # | Recommendation | Repo evidence | Bucket | Disposition | Conf | Notes |
|---|---|---|---|---|---|---|
| S1 | Emit standard artifacts (FHIR, `AuditEvent`, `Provenance`) as boundary | No FHIR adapter; ARCHITECTURE §3.2 "boundary adapters only, never internal model" — deferred | new | research-prompt (scoping) | M | Ties to M3. |
| S2 | Study openEHR contribution semantics for batch commits | README §"Commit discipline" (one commit per decision cycle); v0.3 memo §9 rejects openEHR internals, allows pattern borrow | external-unverified | research-prompt | M | |
| S3 | Support history + as-of semantics rigorously, externally testable | DESIGN §4.3 `currentState.asOf`; `src/time.ts` chart-clock; v0.3 memo §3.4 `invalidated_at` (unauthored ADR 013) | planned | no-op (ADR 013 owns part; export surface lives under M4) | H | |
| S4 | Watch AI Transparency on FHIR IG; adopt selectively | Not in repo | external-unverified | research-prompt (low) | L | Ballot-stage. |

## 5. Compliance and audit foundation

| # | Recommendation | Repo evidence | Bucket | Disposition | Conf | Notes |
|---|---|---|---|---|---|---|
| C1 | Separate human review from machine generation at event + projection level | DESIGN §1.1 `source.kind` agent_* vs clinician_*; `author.role`; v0.3 memo §7.1 attestation | planned | **ADR-candidate (attestation + review + rejection taxonomy)** | H | **Corrected from no-op.** `source.kind` + `author.role` are not enough for review / rejection / cosign / verification state. Report is asking for a richer taxonomy than what exists. Folds into M2 ADR. |
| C2 | Read-path observability (who-read-what / when / which workflow consumed which facts) | Not present. All reads are side-effect-free by design (ARCHITECTURE §1.6) | new | ADR-candidate (later governance) | H | **Corrected from "cheap side-channel".** Not cheap — conflicts with pure-reads guarantee, raises privacy/audit-volume/test-determinism concerns. Deserves its own governance ADR. Not urgent pre-pi-agent integration, but do not assume it is a quick add. |
| C3 | Tamper-evident archival + retention (logical delete, redaction, signatures, retention, exportable audit) | v0.3 memo §3.3: `logical_id`, `fingerprint`, `prev_hash`, chain-reset (ADR 012 unauthored); invariant 2 append-only | partial-planned | ADR-candidate (retention/redaction/export policy) | H | **Corrected.** ADR 012 covers the hash/identity axis. Retention policy, logical-delete semantics, redaction rules, and legal/export procedures are orthogonal and not owned by ADR 012. Separate concern. |

## 6. Defers

| # | Recommendation | Repo evidence | Bucket | Disposition | Conf | Notes |
|---|---|---|---|---|---|---|
| X1 | No full production EHR surface | ADR 016 §Alternatives | shipping | no-op | H | Aligned. |
| X2 | No vector memory primary story | ROADMAP "Later" + v0.3 memo §9 reject list | shipping | no-op | H | Aligned. |
| X3 | No compliance-ready / EHR-replacement positioning | README careful ("Not an EHR clone") | shipping | no-op (discipline) | H | |
| X4 | No overfit to one simulator / demo slice | ADR 016 breadth rule | shipping | no-op | H | Aligned — reinforces M1 breadth requirement. |

## 7. Product framing

| # | Claim | Repo evidence | Bucket | Disposition | Conf | Notes |
|---|---|---|---|---|---|---|
| F1 | "Agent-native clinical record substrate: provenance-rich, append-oriented clinical memory layer that projects into clinician and agent workflows" | README "Durable clinical memory substrate for pi-agent"; ADR 016 "clinical memory"; v0.3 memo "substrate" | partial-aligned | docs-alignment (deferred — see §10) | H | Repo language is close but not identical. Not the next lane. |
| F2 | Avoid "AI-native EHR", "clinical memory-context", "full audit/compliance", "replace your EHR" | README already avoids all four | shipping | no-op | H | |
| F3 | Category preferred: "agent-native clinical record substrate" | README/DESIGN/ROADMAP use "substrate" loosely | partial-aligned | docs-alignment (deferred) | M | |

## 8. OSS code review guidance

All rows `external-unverified`. Research prompts only. No decisions.

| # | Project | Focus per report | Research priority | Prompt |
|---|---|---|---|---|
| O1 | Medplum | bots, Agent runtime, access policies, AuditEvent/Provenance | medium (feeds M2 + M3) | "Read Medplum's bot runtime + access-policy + AuditEvent/Provenance surface. Output: ergonomics + attestation patterns worth matching. ≤500 words." |
| O2 | OpenMRS | Obs/Encounter versioning, concept dict, FHIR2, Envers audit | low | Defer. |
| O3 | GNU Health | federation, Pages of Life, party model | skip | Low relevance per report. |
| O4 | OpenEMR | FHIR/SMART API, log viewer, ONC audit | low | Defer until M3 scoping. |
| O5 | HealthChain | FHIRGateway, aggregate, add_provenance, CDS Hooks | high | "Fetch HealthChain repo README + FHIRGateway. Output: adapter-API ergonomics worth matching for M3. ≤500 words." |
| O6 | EHRbase / openEHR | CONTRIBUTION, versioned compositions, AUDIT_DETAILS, AQL | high | "Compare openEHR CONTRIBUTION to our 'one commit per decision cycle'. Output: does formalizing commit metadata add value? ≤500 words." |
| O7 | HAPI FHIR / OpenHIM | server/plugin arch, message audit persistence | low | Only if M3 or S1 need impl guidance. |

## 9. Standards baseline

| # | Standard | Disposition | Notes |
|---|---|---|---|
| Std1 | FHIR `Provenance` / `AuditEvent` / history interaction | research under M3 + S1 | Boundary emit target. |
| Std2 | AI Transparency on FHIR (HL7 IG) | research (low) | Ballot-stage. |
| Std3 | openEHR CONTRIBUTION + AUDIT_DETAILS | research under O6 | |

---

## 10. Workstreams (revised structure)

The Turn-0 seven-turn workflow collapses into four workstreams. Not all run in
parallel — A is the next lane; B/C/D sequence behind it.

### Workstream A — Immediate product proof (next lane)

**Scope:** Memory-proof projection + six-surface fixture. Pairs M1 + M4 + D1 +
D2 into one coherent build.

**Goal:** Prove "chart once, project many" with one coherent patient story.

**Output (plan-mode target):** A PRD / test-spec describing:
- One coherent fixture story spanning the six ADR-016 surfaces.
- A deterministic memory-proof projection as a formal API / export.
- At least one bedside observation that is entered once and reused across
  note / review / open-loops / handoff without re-entry (ADR 016 verification #4).
- Evidence, provenance, and uncertainty visibly surfaced in the projection.

**Why first:** Operationalizes ADR 016 directly; converts the report's strongest
thesis ("chart once, project many") from substrate capability into a testable
product proof; keeps the repo on its accepted roadmap.

### Workstream B — Governance ADR queue (draft order; do not implement yet)

Sequenced behind A. Authoring order:
1. **Actor / attestation / review taxonomy** (M2 + C1). Covers agent-suggest /
   agent-action / human-verify / co-sign / supersede / reject states. Folds
   v0.3 memo §7.1 into an ADR draft.
2. **Deterministic projection / replay export contract** (M4 formal API).
   Produced as an artifact of Workstream A; lifted into an ADR once the
   fixture proves the API shape.
3. **Read-path observability** (C2). Later. Governance design with real
   tradeoffs (pure-reads guarantee, privacy, audit volume, determinism).
4. **Retention / redaction / logical-delete / export policy** (C3). Orthogonal
   to hash-chain ADR 012. Needed before any credible compliance conversation.
5. **Hash chain + `invalidated_at`** (memo §3.3, §3.4 — ADRs 012/013). Author
   only when Workstream A or B concretely requires them.

### Workstream C — Focused standards research (bounded; 3 questions)

No broad OSS scans. Research only:
1. **FHIR minimum viable boundary** — which 3–5 resources prove external
   credibility? (Not the full 11-resource list from the report.)
2. **openEHR CONTRIBUTION / AUDIT_DETAILS** — does it improve our "one commit
   per agent decision cycle" discipline?
3. **HealthChain / Medplum adapter ergonomics** — what API feels credible to
   external integrators?

Output: three ≤500-word briefs, no adoption decisions. Feeds M3 when it
reaches ADR readiness.

### Workstream D — Positioning docs (deferred, not next)

Diff README primer, DESIGN preamble, ROADMAP intro, v0.3 memo audience line
against the report's preferred phrasing (F1/F3). Do **after** Workstream A so
the language aligns with a stronger demo/projection rather than polishing
strategy without proof.

---

## 11. Recommended next move

Enter plan mode around Workstream A:

> **Memory-proof projection over the six-surface broad EHR skeleton.**

This converts the deep-research report into testable work, operationalizes
ADR 016, and proves "chart once, project many" through fixture + deterministic
projection. Alternatives (positioning pass, FHIR adapter scoping, Phase 7
follow-ups) are weaker next moves — the proof fixture is the gating artifact
that makes every other lane more concrete.

---

## Revision log

- **2026-04-24 (initial):** First-pass matrix. Too permissive — over-classified
  accepted-but-unbuilt items as `shipping/no-op`; under-weighted the
  product-proof gap; proposed seven conversation turns with positioning as the
  next lane.
- **2026-04-24 (post-review):** Tightened T3, M1, M3, M4, M5, D1, D2, C1, C2,
  C3 classifications. Added `partial-shipping` bucket to distinguish "substrate
  exists" from "proof exists". Replaced seven-turn workflow with four
  workstreams. Promoted Workstream A (memory-proof projection + six-surface
  fixture) to next lane; deferred positioning (D) until after the proof lands.
  Corrected source-report filename reference.
