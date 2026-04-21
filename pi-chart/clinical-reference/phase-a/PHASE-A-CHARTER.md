# pi-chart Phase A Charter

**Revision:** v3.1. Read this once before touching the template or execution
plan. The stance here governs every per-artifact output.

**v3.1 changes from v3:** clarified `[verify-with-nurse]` execution-mode
nuance (§4.3); added hybrid-execution rule for the agent-native
transposition section (§4.4).

**Companion files:**
- `PHASE-A-TEMPLATE.md` — the per-artifact output shape. Copy verbatim.
- `PHASE-A-EXECUTION.md` — artifact list, sequencing, deliverables.

---

## 1. Purpose of Phase A

pi-chart is **not an EHR clone.** It is a first-principles clinical memory
substrate for AI-native healthcare simulation. Phase A research asks one
question per artifact:

> **What clinical function must survive if this artifact is stripped of
> legacy EHR form, billing logic, and human-navigation cruft — and what
> minimal pi-chart claim/event structure preserves that function for both
> clinicians and agents?**

Epic, Cerner, hospital policies, and existing documentation conventions are
**optional public witnesses** when they clarify what an artifact *does*.
They are never authorities. Do not try to reverse-engineer proprietary
implementations.

Phase A produces **schema slot proposals**, not final schema. Final schema
is decided by the project owner after reviewing Phase A and resolving the
open questions it surfaces.

---

## 2. The failure mode we design against

> **Phase A fails if it produces nine miniature EHR modules.**

Every rule below is a guardrail against this specific failure. If an
output "looks like EHR documentation, but smaller," the research is off-
thesis regardless of how thorough it is.

Symptoms of the failure mode:

- Field lists that exhaustively inventory current EHR flowsheets
- Proposed pi-chart primitives named after legacy artifacts
  (`MARObject`, `NursingAssessmentRecord`, `FlowsheetRow`)
- `[clinical]` tag used as a wastebasket for "seems important"
- Slot proposals that mirror EHR screen sections one-to-one
- `canonical` / `derived` / `rendered` boundaries blurred or omitted
- Missingness and staleness treated as "edge cases"

## 3. Core stance rules

These govern every artifact output.

### 3.1 Research from function to structure

For each artifact, work in this order:

```
clinical function → minimum data → provenance → lifecycle → pi-chart slot
```

Do not start from legacy EHR screens. Start from the clinical decision or
handoff the artifact enables. Only then identify the minimum fields that
support that decision.

### 3.2 Primitive discipline

**Artifact names are not automatically schema primitives.**

"MAR," "lab flowsheet," "nursing assessment," "provider note," and
"orderset" are legacy packaging units. They are not pi-chart primitives.

pi-chart has a fixed primitive grammar:

```
observation    assessment     intent       action
communication  artifact_ref   note         (new types require justification)

links: supports, supersedes, corrects, fulfills, addresses

views: timeline, currentState, trend, evidenceChain, openLoops, narrative
```

Map legacy artifacts into this grammar before proposing anything new.

### 3.3 Schema entropy budget

New schema concepts are expensive. Prefer, in this order:

1. Existing `type` + existing `subtype`
2. Existing `type` + new `subtype`
3. Existing types with a new `data` payload shape
4. New link convention on existing links list
5. New derived view
6. New `type` value (**requires explicit justification + `schema_impact: new event type`**)
7. New storage primitive (**requires explicit justification**)

If a proposal reaches (6) or (7), it is not silently adopted — it goes to
`OPEN-SCHEMA-QUESTIONS.md` for owner review.

### 3.4 Canonical vs derived vs rendered

Every artifact analysis must identify:

- **Canonical:** what lives in the claim stream as immutable event/note truth.
- **Derived:** what is computed from the claim stream by a view primitive.
- **Rendered:** what exists only in a UI affordance or display layer.

Blurring these is how UI concepts leak into the substrate. If a field
feels hard to place, the default is **rendered** — i.e., not pi-chart's
problem. Earn your way back to derived or canonical with explicit
justification.

### 3.5 The decision test

Every field the researcher proposes to include must pass:

> **What decision, handoff, safety check, trend, fulfillment, or audit
> question fails if this field is absent?**

No answer → the field is `[cruft]` regardless of how standard it looks in
current EHRs. This is the operational form of aggressive filtering.

---

## 4. Field tagging

Every candidate field discussed gets exactly one primary tag:

- **`[regulatory]`** — required by law, accreditation, or enforceable
  policy. Cite source.
- **`[clinical]`** — required for a clinical decision, handoff, or safety
  check. Must pass the decision test.
- **`[agent]`** — required specifically for agent reasoning, simulation
  control, or evaluation, AND not already covered by clinical.
- **`[cruft]`** — captured in current EHRs, deliberately excluded from
  pi-chart. Document *why it exists in EHRs* — billing, legacy workflow,
  regulatory relic, defensive documentation. The "why" validates the
  exclusion.

### 4.1 Rules for `[agent]`

`[agent]` should be **rare**. Most agent-relevant fields overlap with
clinical needs. Legitimate uses:

- `orderset_invocation_id`
- Parent/child event relationships
- `success_criteria`, `contingency_triggers` on care plans
- Evidence interval references
- `openLoop` due_by semantics

### 4.2 Hard guardrail: pi-sim boundary

**Do not tag hidden simulator truth as `[agent]` inside pi-chart.**

Fields that belong outside the chart:

- Simulator-held diagnosis labels
- Grader expected action sequences
- Simulator state variables the agent has not observed
- Agent evaluation scores

If a field exists only to evaluate pi-agent, it belongs in an **external
evaluation trace**, not the patient chart. Preserve the pi-sim boundary:
ground truth does not leak into the record.

### 4.3 Uncertainty flags

Use `[verify-with-nurse]` when the researcher cannot confidently tag a
field. Use `[open-schema]` when a field surfaces a pi-chart design
question the research should not resolve alone.

Do not guess, do not silently resolve.

**Execution-mode nuance.** The `[verify-with-nurse]` tag exists for
research-agent execution, where the researcher is not a nurse and
should queue the question for review. When the project owner (a
nurse) executes a batch directly, resolve these inline — no queue
entry needed. The SUMMARY.md queue should only contain tags from
non-owner-authored artifacts.

### 4.4 Hybrid-execution rule for the agent-native transposition

Template §2 is the load-bearing reframe and the hardest section to do
well without both clinical and systems fluency. A research agent will
tend to produce plausible-but-form-biased §2 sections that read
correctly but quietly describe the artifact in EHR terms.

**Rule:** when a research agent drafts an artifact, the project owner
rewrites §2 personally before moving on. This is non-negotiable. The
rest of the artifact can be reviewed; §2 must be re-authored.

---

## 5. Regulatory scope

Light touch in Phase A. Per artifact:

- Cite 1–5 regulatory or professional anchors when relevant
- Prefer CMS (42 CFR 482), Joint Commission (IM/PC/MM/NR/RC chapters),
  AACN, ANA, SCCM, or peer-reviewed clinical literature
- Cite by standard code with a one-line summary; do not reproduce text
- Flag deeper questions as `[phase-b-regulatory]`

Regulatory sources establish the floor. They do not drive inclusion of
individual fields except where the source clearly requires a specific
field.

---

## 6. Required sections per artifact

The template (`PHASE-A-TEMPLATE.md`) enforces these sections. Every
section is mandatory — not all are long. Thin content is acceptable when
the artifact genuinely has little to say on an axis. Empty sections or
skipped sections are not acceptable.

Load-bearing sections (the ones most at risk of drift):

- **Agent-native transposition** — what this artifact becomes in pi-chart,
  stated as function not form. This is where the reframe happens. If this
  section is weak, the rest will drift back to EHR-shape.
- **Candidate data elements table** — with `what fails if absent?` and
  `sourceability` columns. The decision test is in the table, not a
  separate section.
- **Canonical / derived / rendered** — short but required. Prevents UI
  leakage.
- **Missingness / staleness** — agent-native, usually novel vs. EHR
  thinking. Connects to `openLoops`.
- **Agent read-before-write context** — direct input to future pi-agent
  implementation.
- **Validator and fixture implications** — converts research into
  implementation-ready rules and test data.
- **Proposed pi-chart slot shape** — with `schema_confidence` and
  `schema_impact` fields so the project owner can scan for high-impact
  low-confidence proposals.

---

## 7. Output budgets

Per artifact (except A8, A9b):

- **Length:** 3–5 pages
- **Included fields:** 8–20
- **Cruft examples:** up to 10 unless especially informative
- **Regulatory anchors:** up to 5
- **Open schema questions:** up to 5

A8 (nursing assessment) and A9b (orderset invocation):

- **Length:** 6–8 pages
- **Open schema questions:** unlimited (A9b will drive many)

Tables count toward length. Citations do not.

**Budgets are ceilings, not targets.** An excellent 2-page output beats a
padded 5-page output.

---

## 8. Acceptance criteria

Phase A succeeds if:

- Each artifact has a minimum functional representation tied to clinical
  or agent need
- Each slot proposal maps to existing pi-chart primitives, or flags why
  not via `schema_impact`
- `[regulatory]`, `[clinical]`, `[agent]`, `[cruft]` tags are used with
  discipline
- Cruft is documented with "why it exists" reasoning
- `canonical` / `derived` / `rendered` is clean for every artifact
- Missingness and staleness produce concrete `openLoop` proposals
- View primitive consumers are identified per artifact
- Open schema questions surface rather than resolve silently
- pi-sim boundary is preserved — no ground-truth leakage tagged `[agent]`

Phase A fails if:

- Outputs recreate Epic/Cerner screens in smaller form
- Field inventories dominate (EHR-clone failure mode)
- `[clinical]` becomes a wastebasket
- New schema concepts appear without `schema_impact: new *` flags
- Derived state (current meds, open orders) is treated as canonical
- Nine artifacts produce nine new object types
- Orderset invocation is modeled as flat intents with no parent
  relationship

---

## 9. Hard scope limits

Out of scope:

- Pediatric, OB, neonatal, psych specialty workflows
- Hospice
- Intraoperative / anesthesia records
- Billing, coding, prior auth, discharge planning
- Multi-patient census / handoff workflows
- Full regulatory audit
- FHIR implementation details
- UI stack selection
- International documentation conventions

The research may *mention* these only to explain exclusion.

---

*End of charter. Next: read `PHASE-A-TEMPLATE.md` to see the required
output shape, then `PHASE-A-EXECUTION.md` for the sequenced work plan.*
