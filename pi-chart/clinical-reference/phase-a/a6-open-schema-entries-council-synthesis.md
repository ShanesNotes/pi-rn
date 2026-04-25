# A6 open-schema entries — council synthesis

Staging file for merge into `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`.

Source: `a6-provider-notes-council-synthesis.md` §16, synthesizing the prior A6 synthesis with Claude's A6 output.

## Status triage suggestion

| Status | Question anchors |
|---|---|
| **Accepted direction, pending ADR wording** | `a6-note-primitive-boundary` — keep Markdown note + matching `communication` event; `a6-note-window-timing` — communication events stay point-shaped with `effective_at`, while `data.window` captures clinical coverage; no new A6 `source.kind`; no `links.fulfills` from `communication`; no new A6 URI scheme unless section-selection serialization is accepted. |
| **Open** | `a6-note-subtypes`, `a6-section-and-statement-addressability`, `a6-attestation-primitive`, `a6-consult-and-documentation-closure`, `a6-reasoning-plan-coupling`, `a6-session-coupling`, `a6-legacy-import-and-generated-provenance` |

## Cross-cutting index additions

| Theme | Additions |
|---|---|
| Narrative/document primitive boundary | `a6-note-primitive-boundary`, `a6-attestation-primitive`, `a6-legacy-import-and-generated-provenance` |
| Split vs generic subtypes | `a6-note-subtypes`; compare A5 split `intake_event` / `output_event` precedent |
| Stream/window/section addressability | `a6-section-and-statement-addressability`; link to A3 `vitals://`, A4 `meddose://`, A5 `io://`/`lda://`, A4b item keys |
| Temporal semantics / interval allow-list | `a6-note-window-timing`; cross-check ADR 005 so note coverage windows do not leak into communication `effective_period` |
| Fulfillment/link discipline | `a6-consult-and-documentation-closure`; link to ADR 003 and A2/A4 action-closure patterns |
| Derived vs stored associations | `a6-session-coupling`; link to A5 balance-storage pattern and currentState-axis ADRs |
| Narrative vs structured decomposition | `a6-reasoning-plan-coupling`, `a6-legacy-import-and-generated-provenance`; anchors Phase A live-authoring vs Phase B extraction |
| Teaching/cosign chains | `a6-attestation-primitive`; may expand in A9a/A9b for order cosignature |
| Provenance/source-kind restraint | `a6-legacy-import-and-generated-provenance`; link to ADR 006 and ADR 011 transform provenance |

---

## A6. Provider notes

### a6-note-primitive-boundary

**Question:** Should provider notes remain Markdown note files paired with `communication` events, or should pi-chart introduce a first-class `type: note` clinical event?

**Context:** The substrate already has six clinical event types in `events.ndjson`; notes live as Markdown files with frontmatter and a matching `communication` event whose `data.note_ref` points back to the note. `writeCommunicationNote()` is the sanctioned paired-write path, while `narrative()` reads notes/communications and `evidenceChain()` can include note evidence. The Phase A charter lists `note` in the primitive vocabulary, but the implementation treats it as a narrative storage primitive paired with communication, not as a seventh event family. Provider notes stress this boundary because clinicians naturally say “note” for H&Ps, progress notes, consults, procedure notes, addenda, discharge summaries, and attestations.

**Options:**

1. Keep current paired model: note file is canonical narrative; `communication` event is graph identity. Recommended.
2. Add first-class `type: note` event. Ergonomic for users, but duplicates communication and increases schema entropy.
3. Keep paired model but add note-specific wrapper APIs such as `writeProviderNote()` that compile down to `writeCommunicationNote()` and enforce provider-note payloads.
4. Treat notes as rendered-only summaries. Rejected; authenticated narrative is a real chart claim.

**Researcher's lean:** Option 1 plus Option 3. No new clinical event type in Phase A. Clarify in DESIGN/CLAIM-TYPES that “note” is a sanctioned paired narrative carrier, not an `events.ndjson` type.

**ADR shape:** Amend note/communication docs to state the paired model explicitly and register provider-note subtypes/payload conventions.

### a6-note-window-timing

**Question:** Should provider-note `communication` events use `effective_period` to represent the clinical window they cover, or remain point events with `data.window` for coverage?

**Context:** A progress note may cover an overnight shift and an admission H&P may cover an admission workup interval. Claude's draft used `effective_period` on note communication examples, but current ADR 005 allow-lists interval events only by subtype and does not include communication notes. DESIGN's ADR 004 convention says `communication.effective_at` means sent/authored-at. If note communications become intervals, every narrative view, timing validator, and `recorded_at ≥ effective_at` rule gets muddier. The clinical coverage interval is still necessary for V-NOTE-04-style evidence-in-window validation; it just belongs in payload, not the envelope, unless the owner explicitly extends ADR 005.

**Options:**

1. Point `communication.effective_at` + `data.window` for coverage. Recommended.
2. Add provider-note communication subtypes to the ADR 005 interval allow-list.
3. Store only `effective_at` and derive coverage from cited evidence. Too weak for validators.
4. Use `effective_period` only for `progress_note`. Creates subtype-specific temporal semantics without clear gain.

**Researcher's lean:** Option 1. The communication happened at a time; the note covers a window. Keep envelope time and clinical coverage time separate.

**ADR shape:** Add a note in CLAIM-TYPES/provider-note conventions: `communication.*_note` uses `effective_at`; `data.window` is validator-facing coverage metadata and is not an interval primitive.

### a6-note-subtypes

**Question:** Should A6 register distinct `communication` subtypes (`admission_note`, existing `progress_note`, `consult_note`, `procedure_note`, `event_note`, `attestation`) or a single `communication.provider_note` with `data.note_kind`?

**Context:** `progress_note` is already a conventional communication subtype. Each provider-note kind has different validator obligations: admission notes establish problems and initial plan; progress notes must cite or author in-window evidence; procedure notes reference `action.procedure_performed`; consult notes link to `intent.referral` plus a fulfilling action; event notes cite a trigger; attestations reference a primary note and carry substantive basis. A generic subtype lowers subtype count but turns every validator and view into a switch on `data.note_kind`.

**Options:**

1. Split subtypes: `admission_note`, `progress_note`, `consult_note`, `procedure_note`, `event_note`, `attestation`. Recommended.
2. Single `provider_note` with `data.note_kind` enum.
3. Hybrid: split only validator-sharp types (`admission_note`, `consult_note`, `procedure_note`, `attestation`) and use generic note kind for progress/event.
4. Keep only existing `progress_note` and encode everything in payload. Rejected for validator clarity.

**Researcher's lean:** Option 1. The count is justified because each subtype has distinct obligations. If owner prefers lower subtype growth, Option 3 is the fallback.

**ADR shape:** Register conventional communication subtypes and map V-NOTE rules to subtype names.

### a6-section-and-statement-addressability

**Question:** How should pi-chart cite a specific note section, problem-oriented A/P item, paragraph, or statement instead of citing an entire provider note?

**Context:** Provider notes are multi-claim artifacts. A consult note may contain an antibiotic recommendation, a differential, and a follow-up instruction; a progress note may contain multiple problem-specific A/P paragraphs. Whole-note citation is often too blunt for contradiction handling, evidence chains, or downstream actions. Current note frontmatter `references[]` is string-only, while event `links.supports[]` already admits structured EvidenceRefs with `kind:"note"` and `selection` as an available shape. The missing piece is a stable Markdown/body convention for section keys or quote hashes.

**Options:**

1. Whole-note citation only. Minimal, but weak precision.
2. Markdown section anchors + `EvidenceRef.kind:"note"` with `selection.section` / `selection.heading` / `selection.quote_hash`. Recommended.
3. `note://note_id#section_key` URI as a serialization alias.
4. Extract every note section/statement into child events. Strong but bloats the graph and turns A6 into a note parser.

**Researcher's lean:** Option 2, with Option 3 only if the project prefers URI syntax. Anchor major sections and problem-oriented A/P subsections; leave sentence-level spans for Phase B unless fixtures prove need.

**ADR shape:** Extend note conventions and EvidenceRef parsing to support lightweight note-section selections without long quoted text.

### a6-attestation-primitive

**Question:** Should attending/APP cosign attestation be modeled as `communication.attestation`, `action.attestation`, or an envelope-level `cosigners[]` mutation on the primary note?

**Context:** Teaching/supervision workflows require a durable dated/signed addition to the record. `communication.attestation` reuses paired-note infrastructure and preserves the attestation text as narrative. `action.attestation` treats attestation as a performed clinical act, which fits poorly unless the sole goal is `fulfills` compatibility. Envelope `cosigners[]` is metadata-like but mutates the primary note and can lose substantive attestation text.

**Options:**

1. `communication.attestation` with `data.attests_to` and `data.attestation_basis`. Recommended.
2. `action.attestation` with note_ref payload; action resolves or fulfills a documentation requirement.
3. Envelope-level `cosigners[]` with identity/timestamp/text.
4. Hybrid: envelope cosigner metadata plus `communication.attestation` when text is substantive.

**Researcher's lean:** Option 1. Attestation is an authored communication/documentary assertion. It may `resolves` an attestation-pending openLoop if owner accepts, but it should not require primary-note mutation.

**ADR shape:** Register `communication.attestation`; validator resolves primary note id, verifies role/policy, and rejects boilerplate-only basis.

### a6-consult-and-documentation-closure

**Question:** How should consult completion, H&P due, progress-note due, procedure-note due, discharge-summary due, and attestation loops close without widening `links.fulfills` beyond action-to-intent?

**Context:** A consult order/request is an intent-like obligation. A note proves the recommendation exists, but ADR 003 says only actions fulfill intents. Documentation obligations (H&P due, discharge summary due, attestation due) may not have explicit intent events at all; they are often derived from encounter state and policy windows. Allowing `communication → intent fulfills` would solve local convenience but erode invariant 10.

**Options:**

1. Allow communication to fulfill documentation/consult intents. Rejected unless invariant 10 changes.
2. Derived documentation loops only: `openLoops()` computes missing H&P/progress/discharge/attestation from policy and note presence.
3. Action closure for consult/procedure: `action.notification` with `data.action:"consult_delivered"` or future `action.consult_delivered`; `action.procedure_performed` for procedures. Recommended for consult/procedure.
4. Dedicated `action.documentation_completed` for H&P/discharge/attestation. Explicit but may over-event documentation.
5. Hybrid: derived loops for documentation due; action closure where a clinical intent/request is fulfilled; `communication.attestation` may `resolves` attestation-pending.

**Researcher's lean:** Option 5. Notes never carry `fulfills`. Consult and procedure use action closure. Documentation due states can be derived openLoops unless fixtures prove explicit documentation-completed actions are needed.

**ADR shape:** Add openLoop kinds and validator conventions; defer dedicated consult/documentation actions to A9a/order semantics if needed.

### a6-reasoning-plan-coupling

**Question:** How tightly must a provider note's narrative reasoning and plan decompose into companion `assessment.*` and `intent.*` events?

**Context:** Live pi-chart authoring should not hide new problems, orders, result reviews, medication decisions, device decisions, or monitoring plans inside prose. But legacy imports and acute event notes may be narrative-heavy. Strict everywhere breaks real authoring; loose everywhere defeats the substrate.

**Options:**

1. Strict for all provider notes.
2. Loose for all provider notes.
3. Subtype-dependent: admission/progress/procedure/consult strict on their obligations; event notes may be lighter; imported notes get relaxation. Recommended.
4. Severity-graded: strict in replay; live mode warns/opens loops instead of blocking.

**Researcher's lean:** Option 3 plus Option 4. Live authored notes should write structured changes first or in the same transaction. Narrative-only import is a flagged exception, not a way for imported prose to enter currentState silently.

**ADR shape:** Write-guidance + validator rules: state-changing note statements need structured companion events; note text/event drift creates warnings or openLoops.

### a6-session-coupling

**Question:** When a provider authors one note plus several assessments and intents in one rounding session, should pi-chart store an explicit session id, infer session from author+time, or require bidirectional links?

**Context:** Validators need to find co-authored events for note obligations, and views need to show what the author did during rounds. `data.session_id` is precise but adds a new stored association that can drift. Author+recorded_at proximity is derivable but imprecise. Note-to-event references are precise for events the note intentionally cites but do not group every session event.

**Options:**

1. Implicit derivation from author + recorded_at proximity.
2. Explicit `data.session_id` on all session events.
3. Bidirectional links between note and every co-authored event.
4. Hybrid: implicit grouping for session discovery, explicit note references for clinically cited siblings. Recommended.

**Researcher's lean:** Option 4. No new session id until a concrete query fails without it.

**ADR shape:** Define default session proximity for validators and let note `references[]` / `links.supports[]` provide explicit membership for load-bearing siblings.

### a6-legacy-import-and-generated-provenance

**Question:** How should imported legacy provider notes, dictated/transcribed notes, and AI-generated notes enter the substrate without fabricating structured truth or blurring accountable authorship?

**Context:** Real-world legacy notes arrive as monolithic prose. Synthea/MIMIC/manual fixtures differ in note fidelity. Agent-generated summaries can be useful but must remain distinct from clinician-authored final notes. ADR 006 already supplies source kinds and ADR 011 supplies transform provenance, so the issue is not a new source kind; it is validator behavior, status, and decomposition boundaries.

**Options:**

1. Full NLP extraction at import into structured sibling events. Phase B scope; not required for Phase A.
2. Narrative-only import with `data.import_provenance:"narrative_only"` and `data.decomposition_pending:true`; visible in `narrative()`, not in structured currentState. Recommended for Phase A.
3. Reject legacy notes. Clean but unusable.
4. Agent-generated live notes are `status:"draft"`, `source.kind:"agent_synthesis"`, and carry `transform.input_refs`; clinician signing/attestation promotes authority. Recommended.
5. Add new `source.kind` values such as `provider_note_import` or `copy_forward`. Rejected under ADR 006 restraint; use existing kinds + transform/source.ref.

**Researcher's lean:** Options 2 and 4. Keep imported prose and generated drafts visible but do not let them silently author structured clinical state.

**ADR shape:** Add provenance payload conventions and validator relaxations/requirements for narrative-only imports and generated-note drafts.
