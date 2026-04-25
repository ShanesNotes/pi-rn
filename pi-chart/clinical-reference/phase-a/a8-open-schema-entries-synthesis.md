# A8 open schema entries — ICU nursing assessment

Staging entries for merge into `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`. This council-synthesis version merges the prior A8 open-schema file with the competing head-to-toe artifact. A8 is exempt from the five-question cap, but the entries below are grouped to avoid duplicating the same substrate pressure under multiple names.

## A8 ICU nursing assessment

### a8-exam-finding-shape

**Question:** Should A8 standardize one consolidated `observation.exam_finding` payload or add granular body-system observation subtypes?

**Context:** ICU head-to-toe assessment spans neuro, cardiac/perfusion, respiratory, GI, GU, integumentary, musculoskeletal, psychosocial, pain/symptom, and device-site concerns. Adding `observation.respiratory_assessment`, `observation.neuro_assessment`, `observation.skin_assessment`, etc. would mirror EHR flowsheet sections and consume schema budget quickly. The repo already has `observation.exam_finding`, and the prior A8 synthesis found that `patient_001` already uses it for work-of-breathing.

**Options:**
1. Keep one `observation.exam_finding` subtype with standardized payload fields: `system`, `focus`, `finding_code`, `finding_state`, `body_site`, `measurement`, `severity`, `qualifier`, `method`, `assessment_context`, optional trigger/session/device fields.
2. Add body-system-specific observation subtypes.
3. Add a new `nursing_assessment` event type or parent object.

**Researcher’s lean:** Option 1. Use one consolidated subtype and payload conventions. Body-system subtypes should be rejected unless validator requirements prove impossible with `system`/`focus`/`finding_code`.

**Status:** Open — council synthesis recommendation; likely accepted direction once owner confirms payload.

**Downstream impact:** Updates `CLAIM-TYPES.md` conventional payloads and validator rules; avoids new event type and keeps fixture breadth shallow.

### a8-system-taxonomy-and-coverage

**Question:** Should A8 use the competing artifact’s eight-system head-to-toe enum, the prior synthesis’s broader domain/focus model, or a hybrid?

**Context:** The prior synthesis proposed a flexible domain model that included `pain_symptom`, `device_site`, and `other`. The competing artifact improves coverage semantics by using a familiar eight-system ICU head-to-toe enum: `neuro`, `cardiac`, `respiratory`, `gi`, `gu`, `integumentary`, `musculoskeletal`, `psychosocial`. Pain, LDA site checks, delirium/sedation tools, and risk scores are clinically important but do not need to be extra “systems”; they can live as `focus`, `finding_code`, `observation.screening`, or related artifact links.

**Options:**
1. Strict eight-system enum for `data.system`; flexible `data.focus` and `data.finding_code` carry specifics.
2. Broad domain enum including non-system concerns such as pain, device site, and safety.
3. Hybrid: eight-system enum for coverage and optional `data.domain`/`data.focus` for cross-system concerns.
4. Free-text `system`/`focus`.

**Researcher’s lean:** Option 1 for Phase A, with a narrow escape hatch via `focus`/`finding_code`. It gives validators a coverage surface without turning every nursing concern into a top-level axis. Pain and LDA site findings should be queryable through focus/code/body-site/device refs, not extra systems.

**Status:** Open.

**Downstream impact:** Enables `a8.coverage_gap` rules and handoff grouping. Requires mapping prior `domain` examples to `system` + `focus` in fixtures.

### a8-finding-state-negative-missingness

**Question:** Should `data.finding_state` use a three-valued model — `present | absent | not_assessed` — for A8 findings?

**Context:** Normal-by-exception charting creates the dangerous ambiguity that “no abnormal row exists” may mean normal, not assessed, not documented, or imported prose not decomposed. The prior A8 synthesis separated WDL/normal from missingness; the competing artifact sharpens that into a three-valued state model. This is a substrate-level question because other future exam-like artifacts may need the same absence-as-data discipline.

**Options:**
1. Three-valued `finding_state: present | absent | not_assessed`.
2. Two-valued present/absent plus FHIR-like `dataAbsentReason` for missingness.
3. `normality` enum only: `normal | abnormal | unknown`.
4. Silence means normal within a completed session.

**Researcher’s lean:** Option 1. `present`, `absent`, and `not_assessed` are bedside-finding semantics, not generic data-absent semantics. Silence must remain unknown.

**Status:** Open — strong council recommendation; possible cross-artifact ADR if A9b/specialty exam work recurs.

**Downstream impact:** Validator rules for absence/missingness; open-loop coverage; safer WDL interpretation; better contradiction handling.

### a8-normal-wdl-semantics

**Question:** When is WDL/WNL/normal shorthand canonical, and when is it merely derived or rendered?

**Context:** Normal-by-exception charting is common in nursing assessment, but “no abnormal row exists” is not the same as “nurse examined and found normal.” Conversely, forcing every normal subfinding into separate rows recreates the EHR flowsheet. The competing artifact argues that banning WDL entirely will push nurses back into narrative drift; the prior synthesis argued WDL must not become default normality.

**Options:**
1. Treat all WDL/WNL entries as canonical `observation.exam_finding` events.
2. Treat WDL/WNL as purely rendered from absence of abnormal findings.
3. Store explicit normal/absent observations only when actually assessed and clinically relevant; optionally allow `data.normal_shorthand` / `data.normal_set_id` for a defined set of absent findings, with method/provenance and scoped meaning.
4. Ban WDL/WNL in canonical payloads.

**Researcher’s lean:** Option 3. WDL is acceptable only as an explicit, provenance-bearing shorthand over a defined assessed scope. It must not be inferred from silence, and it should not replace material focused findings.

**Status:** Open.

**Downstream impact:** Prevents copy-forward/WDL bloat while preserving meaningful absence assertions such as “no accessory muscle use after oxygen escalation” or “sacrum intact on high-risk patient.” Requires local normal-set definitions if used.

### a8-finding-vocabulary-scope

**Question:** What controlled vocabulary should `data.finding_code` use for A8 v1?

**Context:** A8 needs queryable distinctions such as crackles vs wheezes, edema present vs absent, non-blanchable erythema, accessory muscle use, cap refill, mental-status features, and site drainage. Full SNOMED CT coverage is rigorous but heavy for Phase A. Pure free text loses queryability and forces NLP extraction from prose.

**Options:**
1. Local Phase-A enum for common ICU findings, with mapping notes to SNOMED CT or other vocabularies later.
2. SNOMED CT clinical-finding subset at v1.
3. Hybrid: local enum for common bedside findings; external code refs where already known.
4. Free-text finding names.

**Researcher’s lean:** Option 1 for Phase A. Keep a small local enum sufficient for fixture breadth and pi-agent reasoning; map later if interoperability becomes a Phase B objective.

**Status:** Open.

**Downstream impact:** Updates `CLAIM-TYPES.md`, fixtures, and validator warnings for unknown finding codes; avoids premature terminology project.

### a8-body-site-encoding

**Question:** How granular should `data.body_site` be — free text, Phase-A enum, SNOMED bodyStructure reference, or hybrid?

**Context:** ICU findings often require localization: right lower lobe breath sounds, bilateral lower-extremity edema, sacrum, right internal jugular insertion site, left AC IV site, heel, pupil left/right. Free text loses queryability; full anatomy ontology is overkill for Phase A.

**Options:**
1. Phase-A enum of ICU-relevant body sites with laterality qualifiers.
2. SNOMED bodyStructure references.
3. Hybrid enum primary with `body_site_unstructured` fallback.
4. Free text only.

**Researcher’s lean:** Option 1 with a limited fallback. Enumerate enough sites for respiratory, skin/wound, edema/perfusion, pupil/neuro, and LDA-site fixtures; defer SNOMED.

**Status:** Open.

**Downstream impact:** Supports LDA-site joins, wound/photo evidence, focused reassessment, and trend projections by location.

### a8-session-identity-and-completeness

**Question:** Are event ids plus grouping enough for head-to-toe clusters, or does A8 need a stored session shell with coverage/completeness semantics?

**Context:** A shift head-to-toe pass writes multiple findings in one documentation cycle. Notes/handoffs may need to cite the whole set or a system section. The prior synthesis leaned toward `data.assessment_set_id` plus EvidenceRef selection to avoid a parent “assessment form.” The competing artifact argues for a stored `assessment.exam_session` with `session_id`, `cadence_class`, `session_status`, and `coverage.systems` so that cross-artifact citations and completeness checks are stable. This pressure also appears in A6/A7 note/session identity and should likely be resolved once across artifacts.

**Options:**
1. Individual event ids only; no session identity.
2. Optional `data.assessment_set_id` on related findings plus derived session view.
3. Stored thin session shell under an existing event family, likely `assessment.exam_session` or `action.measurement`/assessment-performed action.
4. New `session` event family for human-authored event clusters across A6/A7/A8.
5. New `exam://` URI scheme.

**Researcher’s lean:** Option 2 immediately; Option 3 is the strongest candidate if owner accepts stored session identity. Avoid Option 5 unless EvidenceRef ergonomics fail. Do not create a `nursing_assessment` event type.

**Status:** Open — cross-artifact ADR candidate.

**Downstream impact:** Affects A7 admission-note citation obligations, evidenceChain rendering, fixture grouping, coverage-gap validators, addendum/correction lifecycle, and future session identity decisions.

### a8-prn-trigger-shape

**Question:** For `assessment_context: prn` or `focused_reassessment`, should the triggering event/window live in `data.trigger_ref`, `links.supports`, a stored session shell, or all of the above?

**Context:** A PRN assessment happens because something occurred: desaturation, rapid response, procedure return, transport return, analgesic administration, suctioning, repositioning, or provider notification. `links.supports` is an evidence relation used downstream; a trigger is causal/contextual metadata explaining why the finding/session exists. The prior synthesis used support links to the trigger; the competing artifact argues for payload-level `data.trigger`.

**Options:**
1. `data.trigger_ref` on the finding or session, using EvidenceRef shape.
2. `links.supports` to the triggering event/window.
3. Stored session shell carries trigger; findings inherit.
4. Both `data.trigger_ref` and `links.supports`, with distinct roles.

**Researcher’s lean:** Option 1 by default, inherited to findings from session/grouping if a shell exists. Use `links.supports` for evidence relations, not merely “this is why the nurse reassessed.”

**Status:** Open.

**Downstream impact:** Clarifies openLoop closure, timeline display, and trigger-driven fixture generation; may become a broader convention for PRN-cadence artifacts.

### a8-reassessment-response-coupling

**Question:** How should focused reassessments after interventions close response-to-intervention loops without violating ADR 003 fulfillment semantics?

**Context:** Pain meds, oxygen escalation, suctioning, repositioning, provider notification, and protocol-driven interventions require reassessment. The finding is evidence of response, but an observation should not `links.fulfills` an order/intent under the intermediate-action model.

**Options:**
1. Let `observation.exam_finding` directly `links.fulfills` reassessment intents.
2. Use `action.measurement` or `action.intervention` to fulfill a monitoring/reassessment intent; A8 findings `links.supports` that action and/or `links.resolves` the open loop.
3. Use `assessment.response` for every response.
4. Treat reassessment closure as derived only.

**Researcher’s lean:** Option 2 by default. Add an `assessment.response` only when a nurse/provider is making an interpretation beyond the finding. Do not put `links.fulfills` on raw A8 observations.

**Status:** Open.

**Downstream impact:** Validator rule: focused A8 findings should have trigger/action evidence; fulfillment stays on action events.

### a8-nursing-scope-assessment-boundary

**Question:** What payload/profile rules distinguish RN-authored nursing judgments from medical diagnoses?

**Context:** RNs author observations and nursing-scope judgments, but Phase A should avoid letting RN-authored medical diagnoses become unreviewed problem-list truth. A0c already frames problems as evidence-backed assessments, while A8 covers nursing findings and nursing care-plan/risk judgments.

**Options:**
1. Prohibit RN-authored `assessment.*` except risk scores.
2. Permit RN-authored `assessment.trend`, `assessment.severity`, `assessment.risk_score`, and profile-scoped `assessment.impression` with `data.scope: nursing`; warn on medical-diagnosis-like content unless provider support/profile approval exists.
3. Create a separate nursing-diagnosis event family.
4. Let any RN-authored assessment promote directly to problem truth if evidence-backed.

**Researcher’s lean:** Option 2. Use existing assessment subtypes and author/profile validation. Do not create nursing diagnosis primitives in Phase A.

**Status:** Open.

**Downstream impact:** Adds scope-of-practice validator warnings and supports A7/A8 narrative decomposition without importing a full NANDA/care-plan taxonomy.

### a8-assessment-cadence-openloops

**Question:** Should assessment cadence live only in active `intent.monitoring_plan`/institutional profiles, or should A8 define default staleness rules?

**Context:** ICU assessment frequency varies by unit, acuity, intervention, policy, and patient condition. A global “Q4h head-to-toe” rule would be false in many contexts, but the agent still needs concrete open loops for missing/reassessment obligations. The competing artifact proposes admission all-system coverage and shift minimum coverage; the council synthesis treats these as adult ICU fixture/profile defaults, not universal schema law.

**Options:**
1. Hard-code default A8 cadence and coverage in the global validator.
2. Derive cadence from `intent.monitoring_plan`, `intent.care_plan`, protocols, and institutional profile defaults; fixtures may use adult ICU defaults.
3. No A8 staleness/open loops; leave to notes/handoff.
4. Store cadence only on a future A8 session shell.

**Researcher’s lean:** Option 2. Phase A fixtures may use provisional adult ICU profile defaults: admission all 8 systems; shift minimum neuro/respiratory/cardiac/integumentary; focused reassessment by trigger. Global schema should not hard-code cadence.

**Status:** Open.

**Downstream impact:** Requires `openLoops()` support for domain-specific assessment missing, coverage gap, and focused-reassessment pending loops.

### a8-wound-skin-artifact-refs

**Question:** How should wound/skin/photo evidence be linked without creating a wound module?

**Context:** Skin and wound findings can be clinically decisive and photo-supported. The photo is evidence, not the finding itself; the finding still needs location, appearance, severity/stage where appropriate, provenance, and follow-up plan.

**Options:**
1. Store wound photos only as `artifact_ref` with no structured A8 finding.
2. Store structured `observation.exam_finding` and cite `artifact_ref` when the image supports the finding.
3. Create a dedicated wound-assessment storage primitive.
4. Store image path in the finding payload.

**Researcher’s lean:** Option 2. Keep image/media as artifact evidence; keep clinical wound/skin truth in A8 observations and nursing-scope assessments. Consent and image-retention policy are Phase B/profile issues.

**Status:** Open.

**Downstream impact:** Validator should warn on raw image paths in payload and require artifact refs when images are used as evidence.

### a8-a7-structured-vs-narrative-boundary

**Question:** Which nursing-note assessment statements require structured A8 siblings?

**Context:** A7 already establishes that nursing notes cite and synthesize structured findings. Notes commonly contain “lungs coarse,” “skin intact,” “confused,” “pain 7/10,” or “pressure injury noted.” Some of these are care-changing facts; some are stable narrative context.

**Options:**
1. Require every assessment-like note phrase to have A8 extraction.
2. Require structured siblings for care-changing findings: anything that changes assessment, plan, safety state, monitoring, response obligation, escalation, or handoff risk; leave stable narrative/imported legacy prose as narrative with extraction debt.
3. Let notes remain the canonical assessment truth.
4. Require A8 siblings only for admission notes.

**Researcher’s lean:** Option 2, aligned with A7. Admission and focused/event notes should cite A8 evidence for material findings; routine prose may remain narrative if it does not change care.

**Status:** Accepted direction from A7; still open for validator threshold detail.

**Downstream impact:** Future note-drafting agent should decompose care-changing assessment statements into A8 events before or with the note.

### a8-a5-lda-site-boundary

**Question:** How should A8 site findings reference A5 LDA identity and lifecycle without duplicating device truth?

**Context:** A5 owns line/tube/drain in-service intervals, placement/removal actions, and device identity. A8 owns observed site findings: redness, swelling, drainage, pain, dressing integrity, local skin breakdown, and wound appearance. A finding must be linked to an active device when clinically relevant.

**Options:**
1. Duplicate LDA active status in every A8 finding payload.
2. Reference A5 device identity/segment with `related_lda_key` or EvidenceRef, while A5 remains source of lifecycle truth.
3. Move LDA site findings into A5 only.
4. Create a new wound/LDA-site module.

**Researcher’s lean:** Option 2. A8 owns the observed site/skin finding; A5 owns lifecycle/context. `related_lda_key` remains provisional until A5 LDA identity/addressability is resolved.

**Status:** Open, dependent on A5 LDA identity/addressability.

**Downstream impact:** Validator can warn when A8 `related_lda_key` does not resolve to an active/recent A5 LDA segment. Fixture needs at least one line-site finding tied to active device.

### a8-current-state-axis-for-exam

**Question:** Does A8 need `currentState(axis:"exam")`, or can initial fixtures use existing timeline/currentState-all projections?

**Context:** The current repo’s `CurrentStateAxis` list does not include a dedicated exam/assessment axis. Handoff and agent context may benefit from “latest exam finding by system/focus/body_site,” but piecemeal axes are already a cross-artifact concern.

**Options:**
1. No new axis; use `timeline()` filters and `currentState(axis:"all")` until fixtures show need.
2. Add `currentState(axis:"exam")` for latest A8 findings by system/focus/body_site plus staleness metadata.
3. Fold A8 into a broader future `currentState(axis:"observations")` or cross-artifact domain-state ADR.
4. Create a dedicated `headToToe()` view primitive.

**Researcher’s lean:** Option 1 for immediate A8; Option 3 if multiple artifacts need the same projection. Do not add an axis solely because the EHR has an assessment tab.

**Status:** Open / defer until fixture proof.

**Downstream impact:** If deferred, agent read-before-write uses `timeline()` filters and evidenceChain. If accepted later, implement deterministic latest-by-system/focus/body_site projection and staleness metadata.
