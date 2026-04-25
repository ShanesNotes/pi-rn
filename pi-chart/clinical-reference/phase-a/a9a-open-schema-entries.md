# A9a Open Schema Entries — Individual Order Primitive Council Synthesis

Durable-home entries intended for merge into `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`.

Group order: canonical shape; authoring and lifecycle; conditional/fulfillment semantics; family-specific shapes; boundary clarifications.

## A. Canonical shape

### a9a-canonical-subtype `[open-schema]`

- **Problem statement:** Should an individual clinical order be a single `intent.order` event with `data.order_kind`, or should each order family be its own `intent.*` subtype?
- **Options considered:**
  1. Single `intent.order` + `data.order_kind`.
  2. Split into `intent.medication_order`, `intent.lab_order`, `intent.imaging_order`, etc.
  3. Hybrid split for high-volume families only.
  4. FHIR-like resource taxonomy translated into pi-chart.
- **Current lean:** Single `intent.order`. Split only if a family develops distinct lifecycle semantics that cannot be represented as payload.
- **Affected artifacts:** A1, A2, A3, A4, A4b, A5, A6, A7, A8, A9b, validators, `CLAIM-TYPES.md`.
- **Why it matters:** This is the main schema-entropy decision for A9a. Splitting too early turns Phase A into miniature CPOE; refusing payload discipline makes validators weak.

### a9a-order-kind-registry `[open-schema]`

- **Problem statement:** Should `data.order_kind` be a closed enum, a profile-registered enum, or open text?
- **Options considered:**
  1. Closed canonical enum in schema.
  2. Closed core enum + profile-registered extensions.
  3. Open string with validator warnings.
- **Current lean:** Closed core enum + profile-registered extensions. Core values: `medication`, `lab`, `imaging`, `respiratory`, `diet`, `activity`, `consult`, `procedure`, `monitoring`, `nursing_communication`, `blood_product_prepare`, `blood_product_transfuse`, `lda_placement`, `lda_removal`, `restraint`.
- **Affected artifacts:** A4, A5, A9b, validator profiles, fixture generation.
- **Why it matters:** Validators need predictable families, but hospital systems have local orderable types. This is the narrow extensibility seam.

### a9a-indication-exception-shape `[open-schema]`

- **Problem statement:** How should orders that legitimately do not address an active problem — prophylaxis, screening, protocol surveillance, admission administration — avoid false `missing_indication` loops without weakening `links.addresses` discipline?
- **Options considered:**
  1. `data.indication_exception` enum such as `vte_prophylaxis`, `screening`, `protocol`, `surveillance`, `perioperative`, `administrative`, `post_exposure_prophylaxis`.
  2. Introduce `assessment.risk` or similar and allow `links.addresses` to target it.
  3. Free-text `data.indication` only.
  4. Profile suppression only.
- **Current lean:** Option 1 for A9a. Option 2 may become valuable later, but is higher entropy.
- **Affected artifacts:** A0c, A4, A4b, A9a, A9b, validators.
- **Why it matters:** Agents need to distinguish orphan therapeutic orders from legitimate prophylaxis/screening/protocol orders.

## B. Authoring and lifecycle

### a9a-verbal-order-metadata `[open-schema]`

- **Problem statement:** Where do verbal, telephone, and secure-text order channel, read-back, receipt, and authentication metadata live?
- **Options considered:**
  1. Payload fields on `intent.order`: `data.authoring_channel`, `data.read_back`, `data.authentication`.
  2. Family-specific `data.verbal_order` sub-block.
  3. Paired `communication` or `action.order_communication` event.
  4. New `source.kind` values for every channel.
- **Current lean:** Option 1, with existing `source.kind` and `source.ref` as provenance. Do not add new event/link/source kinds by default.
- **Affected artifacts:** A6, A7, A9a, validators, source-kind ADR.
- **Why it matters:** Verbal/text order safety is regulatory and clinical, but creating a communication-order primitive duplicates the order claim.

### a9a-order-lifecycle-discontinue-cancel `[open-schema]`

- **Problem statement:** How should pi-chart distinguish modification, discontinuation, cancellation, void/entered-in-error, hold, and resume without mutating the original order?
- **Options considered:**
  1. Superseding `intent.order` with `links.supersedes`/`links.replaces` and terminal `data.status_detail`.
  2. Explicit discontinuation/hold/resume `intent.order` events when the stop/hold itself is the clinical instruction.
  3. Separate `action.cancel` for pre-fulfillment voids.
  4. `links.contradicts` + `links.resolves` for corrective/contradiction cases.
- **Current lean:** Use supersession/status_detail as default; allow explicit discontinuation order when clinically meaningful; keep pre-fulfillment `action.cancel` open.
- **Affected artifacts:** A4, A4b, A5, A9a, A9b, `currentState(axis:"intents")`.
- **Why it matters:** Incorrect mutation semantics make order history unauditable; over-modeling creates order-management machinery.

### a9a-occurrence-identity `[open-schema]`

- **Problem statement:** Should scheduled/recurring order obligations use deterministic virtual occurrence keys beyond A4's proposed `meddose://`, or should fulfillment point only to the parent order?
- **Options considered:**
  1. Parent-order-only fulfillment; openLoops derive missed occurrences from schedule + actions.
  2. Family-specific virtual occurrence keys such as `meddose://`, `labdraw://`, `caretask://`.
  3. Materialized child `intent.order` events for each due occurrence.
- **Current lean:** Parent-order-only for A9a default; preserve A4's `meddose://` as narrow medication exception candidate. Defer generalized occurrence URI until fixtures prove parent-only closure is ambiguous.
- **Affected artifacts:** A3, A4, A5, A8, A9a, A9b, `openLoops()`.
- **Why it matters:** Occurrence identity determines whether one action can safely close one due obligation without masking missed sibling obligations.

## C. Conditional and fulfillment semantics

### a9a-prn-trigger-shape `[open-schema]`

- **Problem statement:** How is a PRN order's trigger represented, and how is “trigger satisfied” evidence captured at administration?
- **Options considered:**
  1. `data.trigger_ref` + `data.trigger_text` on the order; `data.trigger_satisfied_by` on the admin/action event.
  2. New link kind `links.triggered_by`.
  3. Pure derived trigger evaluation from current state, no stored reference.
- **Current lean:** Option 1. This inherits the A8 council direction and avoids a new link kind.
- **Affected artifacts:** A4, A8, A9a, A9b, validators.
- **Why it matters:** PRN administration must be auditable to a valid indication/trigger; free text and new link kinds both create drift.

### a9a-conditional-hold-titration-payload `[open-schema]`

- **Problem statement:** What is the minimum shared payload for PRN triggers, hold parameters, titration targets, prerequisites, and monitoring requirements?
- **Options considered:**
  1. Free-text conditional instructions only.
  2. Shared arrays/objects: `conditions[]`, `hold_parameters[]`, `titration`, `prerequisites[]`, `monitoring_requirements[]`.
  3. Family-specific condition schemas only.
- **Current lean:** Option 2 with small canonical vocabulary and free-text fallback. Policy thresholds remain profile-owned.
- **Affected artifacts:** A3, A4, A5, A7, A8, A9a, A9b.
- **Why it matters:** Agents need computable triggers to detect unsafe administration, missing fulfillment, missed monitoring, and missing response evidence.

### a9a-result-fulfillment-pathway `[open-schema]`

- **Problem statement:** For result-producing orders, how is “the order is fulfilled” expressed?
- **Options considered:**
  1. Strict ADR 003: order is fulfilled by an acquisition/performance action; result observation/artifact supports that action.
  2. Allow direct `observation -> links.fulfills -> order` for trivial cases.
  3. Materialize/import implicit acquisition actions when legacy data lacks them.
- **Current lean:** Option 1 for native writes; Option 3 only for import/backfill with transform/import provenance. Reject Option 2.
- **Affected artifacts:** A1, A2, A3, A5, A6, A8, A9a, importers, validators.
- **Why it matters:** Direct observation-to-order fulfillment collapses request, performance, result, and review, weakening audit and openLoops.

## D. Family-specific shapes

### a9a-blood-product-order-shape `[open-schema]`

- **Problem statement:** Is “transfuse 1 unit pRBC” one order or two coupled orders: prepare/type-screen/crossmatch and transfuse?
- **Options considered:**
  1. Two `intent.order` events: `blood_product_prepare` and `blood_product_transfuse`; transfuse supports/depends on prepare.
  2. One `intent.order(order_kind:"blood_product")` with `data.phase`.
  3. One transfuse order with `data.requires_prepare: true` and derived prerequisite checking.
- **Current lean:** Lean Option 1, but defer operator decision. The two-order shape is more legible to agents and prerequisite openLoops; one-order shape has lower event count.
- **Affected artifacts:** A1, A2, A4, A9a, A9b, validators, transfusion fixtures.
- **Why it matters:** Blood products have distinct preparation, compatibility, expiration, consent/witness, and administration obligations.

### a9a-restraint-order-shape `[open-schema]`

- **Problem statement:** Is restraint pure `intent.order` with regulation/policy-bounded `effective_period`, or does it need a special renewal action/lifecycle?
- **Options considered:**
  1. `intent.order(order_kind:"restraint")` with regulation class and bounded effective period; renewal via supersession.
  2. Separate `action.restraint_renewal` or `action.restraint_review`.
  3. Dedicated restraint storage/session primitive.
- **Current lean:** Option 1 for A9a. Reviews/assessments may be separate actions/findings if clinically needed, but the order remains an order.
- **Affected artifacts:** A0b, A8, A9a, validators, policy profiles.
- **Why it matters:** Restraints are a canonical test of regulatory cadence without building a restraint module.

### a9a-monitoring-order-vs-monitoring-plan `[open-schema]`

- **Problem statement:** When is a monitoring request an `intent.order(order_kind:"monitoring")` versus an `intent.monitoring_plan`?
- **Options considered:**
  1. `intent.order` for all monitoring requests.
  2. `intent.monitoring_plan` for any cadence/coverage rule; `intent.order` only for task-like one-shot monitoring.
  3. Collapse `intent.monitoring_plan` into A9a order family.
- **Current lean:** Option 2. A3 already establishes monitoring-plan semantics; A9a should not swallow it.
- **Affected artifacts:** A3, A8, A9a, A9b, `openLoops()`.
- **Why it matters:** Monitoring cadence is a safety rule, not merely a department order row.

## E. Boundary clarifications

### a9a-protocol-standing-order-boundary `[open-schema]`

- **Problem statement:** What minimal protocol/order-set reference can A9a carry without pre-solving A9b?
- **Options considered:**
  1. A9a child orders carry only a minimal `data.invoked_by` or source/protocol ref.
  2. A9a stores order-set/session parent metadata and child grouping.
  3. A9a ignores protocol lineage entirely until A9b.
- **Current lean:** Option 1. Keep child orders ordinary; A9b owns invocation shell, governance, and child generation.
- **Affected artifacts:** A9a, A9b, A4, A5, A6/A7 notes.
- **Why it matters:** Losing protocol lineage weakens audit; modeling it too early turns A9a into A9b.

### a9a-isolation-and-code-status-boundaries `[open-schema]`

- **Problem statement:** Are isolation precautions, code status, POLST, and advance directives ordinary orders in A9a or constraints/baseline context owned elsewhere?
- **Options considered:**
  1. Treat isolation/code/POLST as A0a/A0b constraints/context; A9a only consumes them.
  2. Model them as ordinary `intent.order` rows.
  3. Duplicate as both constraint and order.
- **Current lean:** Option 1. Code/POLST/advance directives are A0b constraints; isolation is encounter/baseline/constraint context depending live substrate. A9a validators read them.
- **Affected artifacts:** A0a, A0b, A6, A7, A9a.
- **Why it matters:** Treating code status or POLST as ordinary orders weakens the non-negotiable safety predicate model.

### a9a-source-kind-channel-boundary `[open-schema]`

- **Problem statement:** Should authoring channels such as verbal, telephone, secure text, and protocol-standing order become `source.kind` values or remain payload/source-ref metadata?
- **Options considered:**
  1. Keep `source.kind` closed and represent channel in `data.authoring_channel` plus `source.ref`.
  2. Add channel-specific source kinds.
  3. Store channel only in supporting communication/artifact refs.
- **Current lean:** Option 1. Do not amend ADR 006 unless live implementation proves source-kind branching is necessary.
- **Affected artifacts:** A6, A7, A9a, source taxonomy ADR, validators.
- **Why it matters:** Source-kind sprawl undermines provenance discipline; hiding channel metadata undermines order safety.
