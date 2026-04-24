# pi-chart Phase A Execution Plan

**Revision:** v3.2. The sequenced work plan for Phase A. A researcher drives
through this file top to bottom.

**v3.2 changes from v3.1:** Added Batch 0 (foundational primitives —
patient/encounter baseline, active constraints, problem list) as mandatory
first; added A4b medication reconciliation as a Batch 2 primitive paired
with A4 MAR; expanded the calibration stop to span Batch 0 + Batch 1.
Motivation: A1/A2 calibration surfaced that every subsequent artifact's
`readActiveConstraints()` / `currentState(axis: "constraints")` /
`activeProblems()` read-before-write pattern rests on structural types
(`subject`, `constraint_set`, `assessment.subtype=problem`) that are
referenced by the substrate but never researched. Better to surface this
in the calibration stop than propagate EHR-tab drift through Batches 2–3.

**v3.1 changes from v3:** output location moved to
`clinical-reference/phase-a/`; §5 updated to reflect ADR 001
(Synthea-primary, MIMIC deferred).

**Current local state (2026-04-24):** Batch 0 and Batch 1 artifacts are
present. Batch 2 has A3 and A4 synthesis artifacts plus separate
open-schema-entry synthesis files. A4b and A5-A9b are not present yet.
`SUMMARY.md` is not present yet.

**Read first:**
- `PHASE-A-CHARTER.md` — stance, rules, failure modes
- `PHASE-A-TEMPLATE.md` — per-artifact output shape

**Output location:** `clinical-reference/phase-a/`

`clinical-reference/` is the substrate's clinical-research home
(existing folder, per ROADMAP Track A). `docs/research/` remains the
home for directive / governance documents (this file, the charter, the
template). One folder for "what the chart contains" research; one
folder for "how the research is governed."

---

## 1. Batches

Research proceeds in **four** batches, strictly ordered. A calibration stop
separates Batch 1 from Batch 2 — do not skip it. Batch 0 is mandatory
first and folds into the calibration review.

### Batch 0 — Foundations (3 files, mandatory first)

| ID   | Artifact                                                     |
| ---- | ------------------------------------------------------------ |
| A0a  | Patient demographics, encounter context & baseline           |
| A0b  | Active constraints (allergies, code status, advance directives) |
| A0c  | Problem list & active problems (assessment subtype=problem)  |

**Purpose of Batch 0.** These three artifacts produce (or directly feed)
the `patient.md`, `constraints.md`, and core `assessment` events that
the rest of the chart builds on. They correspond to the three
**structural chart types** already named in `CLAIM-TYPES.md` (`subject`,
`encounter`, `constraint_set`) plus the `assessment.subtype=problem`
event type that downstream artifacts cite but never define.

Batch 0 is not optional. A1/A2 calibration established that every
subsequent artifact makes read-before-write calls to these primitives
(`readActiveConstraints()`, `currentState(axis: "constraints")`,
`activeProblems(patient)`). Without Batch 0, those calls rest on
undefined ground — every V-LAB-*, V-RES-*, V-MAR-* rule that references
allergies, code status, or active problems is implicitly assuming a
primitive shape that has never been interrogated.

### Batch 1 — Calibration (2 files)

| ID  | Artifact                                            |
| --- | --------------------------------------------------- |
| A1  | Lab results flowsheet                               |
| A2  | Results review (imaging / tests / procedures)       |

### Batch 2 — Main (6 files)

| ID   | Artifact                                                  |
| ---- | --------------------------------------------------------- |
| A3   | Vital sign flowsheet                                      |
| A4   | MAR (Medication Administration Record)                    |
| A4b  | Medication reconciliation & home medication list          |
| A5   | Intake & Output + Lines/Tubes/Drains (LDAs)               |
| A6   | Provider notes (H&P, progress, consult, rounding)         |
| A7   | Nursing notes                                             |

A4b is paired with A4 deliberately: MAR is the fulfillment ledger
(action → intent), reconciliation is the intent-layer assessment that
feeds MAR by comparing home/inpatient/discharge medication state. They
exercise the same primitive grammar from both sides in one sitting.
Produce A4 first, then A4b; reconciliation is downstream of
understanding MAR semantics.

### Batch 3 — Heavy (3 files, A9 split)

| ID   | Artifact                                   |
| ---- | ------------------------------------------ |
| A8   | ICU nursing assessment (head-to-toe)       |
| A9a  | Individual order primitive                 |
| A9b  | Orderset invocation model                  |

**Total artifacts: 14.** Still comfortably within scope.

**What Batch 2 does NOT add.** Therapy orders (PT/OT/RT), dietary
orders, consult orders, and procedure orders are order *subtypes* that
A9a handles via its subtype grammar, not separate artifacts. Discharge
planning is Phase B narrative scope and will fold into A6's note-type
subtypes. Isolation precautions are an encounter-header field
(A0a/encounter). Patient education is Phase B. Clinical decision
support alerts are explicitly pi-sim anti-pattern territory per charter
§4.2 and are not modeled as canonical claim stream. These exclusions
are not oversights; they are a consequence of the substrate's
primitive discipline.

---

## 2. Calibration stop — mandatory, between Batch 1 and Batch 2

**Original gate:** after A0a-A0c + A1 + A2 are produced, stop and wait
for project-owner review.

**Current state:** A3 and A4 synthesis artifacts now exist, so the
calibration gate has already been passed or bypassed in practice. Do not
start A4b, A5, A6, A7, A8, A9a, or A9b until the project owner either
retroactively signs off Batch 0/1 calibration or records a new routing
decision.

### Why the stop matters (expanded for Batch 0)

A0a–A0c and A1/A2 calibrate the template against two different
pressures:

- A1 (labs) and A2 (results review) are deceptively simple. They map
  cleanly to existing Synthea data and existing pi-chart types, which
  makes it easy to produce outputs that *look* correct but have
  quietly drifted toward EHR-clone territory.
- A0a–A0c (demographics/encounter, constraints, problems) are
  foundational. They are referenced — as structural types or downstream
  targets — by every artifact that comes after. If Batch 0 drifts into
  EHR-tab thinking ("the allergies tab," "the problem list module,"
  "the patient header"), every subsequent artifact's
  `readActiveConstraints()` / `currentState(axis: "constraints")` /
  `activeProblems()` pattern drifts with it.

Together Batch 0 + Batch 1 calibrate five things:

1. **Template depth.** Are all 17 sections filled with substance, or are
   some thin/generic?
2. **Agent-native transposition language.** Does §2 describe what the
   artifact *becomes*, or does it describe the artifact in EHR terms?
3. **Cruft discipline.** Are excluded fields documented with "why it
   exists"? Is the cruft list specific, not generic?
4. **Decision-test rigor.** Does every included field have a concrete
   "what fails if absent?"
5. **Constraint/problem substrate integrity** *(new with Batch 0).*
   Are constraints represented as an event stream rather than a mutable
   "allergies tab"? Are problems `assessment` events with full
   `links.supports` provenance rather than a flat active-problem list?
   Are these primitives structured so `readActiveConstraints()` and
   `activeProblems()` remain derived queries, not stored truth?

### Calibration test — A0a–A0c + A1/A2 should demonstrate

The full end-to-end pattern, including the new foundations:

```
patient baseline + encounter (A0a) arrive →
  active constraints asserted (A0b, constraint events with severity
  + evidence) →
  problems asserted (A0c, assessment subtype=problem with
  links.supports to observations) →
  result arrives (observation, A1) →
  result is represented (canonical event, structured values) →
  result is reviewed (action.subtype = result_review, A2) →
  result supports reasoning (assessment links via supports) →
  result triggers follow-up (intent) or closes a loop (openLoop
  resolution) →
  any write validates against readActiveConstraints() before
  commit →
  result may be amended (supersession lifecycle)
```

If the outputs only produce field inventories — even thorough ones —
the template is not working yet. Revise before continuing.

A0a–A0c specifically must produce at least one concrete `openLoop`
example tied to missing or incomplete foundational data (e.g., "no
allergy documentation on admission → openLoop until resolved"; "code
status unspecified for ICU patient → openLoop blocking elective
procedure intents").

### Calibration review checklist (project owner)

Before approving Batch 2 start, every checkbox must pass across all
five calibration artifacts (A0a, A0b, A0c, A1, A2):

- [ ] §2 (agent-native transposition) is function-first, not form-first
  — *especially* for A0b constraints and A0c problems, which are the
  artifacts most at risk of drifting to "the allergies tab" / "the
  problem-list module"
- [ ] §7 has `what fails if absent?` answered concretely for every row
  (for A0b: "agent cannot safely write any medication intent without
  reading this" is the canonical answer pattern)
- [ ] §7 has `sourceability` answered for every row (pi-sim, Synthea,
  MIMIC, manual-scenario all valid per-artifact)
- [ ] §8 has "why it exists" for every cruft entry (expect repeated
  patient-header cruft across A0a, A1, A2)
- [ ] §9 separates canonical / derived / rendered cleanly
  — constraints and problems are canonical; "current active
  constraints" and "active problem list" are derived; any UI badge
  ("NKDA," "DNR wristband color") is rendered
- [ ] §11 proposes concrete staleness→openLoop links
  (A0b: incomplete allergy documentation; A0c: problem without
  recent supporting evidence; A1: critical result unreviewed; A2:
  amended result post-review)
- [ ] §12 lists specific view calls, not "read the chart"
  (`readActiveConstraints()`, `currentState(axis: "constraints")`,
  `activeProblems()`, `openLoops()`)
- [ ] §14 uses existing primitives where possible; new proposals have
  `schema_confidence` + `schema_impact` flags
- [ ] §15 has at least one validator rule. Batch 0 must produce at
  least one *cross-artifact* validator: "no medication intent may be
  written unless active constraints are read and no contraindication
  exists," or equivalent.
- [ ] `OPEN-SCHEMA-QUESTIONS.md` has been populated with any
  `[open-schema]` items surfaced by Batch 0 or Batch 1. A1/A2 already
  surfaced Q1 (consolidated subtype), Q2 (fulfillment semantics), Q3
  (effective_at); Batch 0 is expected to surface additional questions
  around constraint lifecycle, advance-directive versioning, and
  problem resolution semantics.

If any checkbox fails, the researcher revises the affected artifacts
before Batch 2.

---

## 3. Batch execution rules

### Within-batch

- One artifact per pass. Do not parallelize across batches.
- Within a batch, artifacts may be produced in any order *except*:
  - Batch 0: A0a (demographics/encounter) should precede A0b/A0c because
    the envelope-level `subject`/`encounter` scoping is what constraints
    and problems hang from.
  - Batch 2: A4 (MAR) should precede A4b (reconciliation) because
    reconciliation's fulfillment-ledger semantics derive from MAR's.

### Output budgets (from charter §7)

- **Batch 0, Batch 1, Batch 2 artifacts:** 3–5 pages, 8–20 fields, up to
  10 cruft entries, up to 5 regulatory anchors, up to 5 open questions.
- **A8, A9b:** 6–8 pages, open-question ceiling removed for A9b.

### Permitted A9 split

A9 may split into A9a (individual order primitive) and A9b (orderset
invocation model). An individual order is a straightforward `intent`
event. Orderset invocation is a schema-design question — how does
selecting a template produce N linked child intents? Treat them as
separate artifacts.

### Permitted A4 pairing

A4 and A4b are produced as a pair, in that order. A4 handles the MAR as
fulfillment ledger (administration actions fulfilling medication
intents). A4b handles home-med reconciliation and the discrepancy-
resolution flow that feeds MAR on admission, transfer, and discharge.
Reconciliation is a distinct primitive — it is closer to an assessment
over current medication state that produces discrepancy-resolution
intents — and deserves its own artifact rather than being folded into
A4 as a §13 "related artifact" note.

### Schema proposals

Every slot proposal uses `schema_confidence` + `schema_impact` fields
(template §14). If `schema_impact` is `new event type` or `new storage
pattern`, the proposal *requires* an `OPEN-SCHEMA-QUESTIONS.md` entry
justifying it against the schema entropy budget (charter §3.3).

---

## 4. Deliverables

All files live in `clinical-reference/phase-a/`.

### Per-artifact files

```
a0a-patient-demographics-encounter.md
a0b-active-constraints-synthesis.md
a0c-problem-list-synthesis.md
a1-lab-results.md
a2-results-review.md
a3-vital-signs-synthesis.md
a4-mar-synthesis.md
a4b-medication-reconciliation.md
a5-io-and-ldas.md
a6-provider-notes.md
a7-nursing-notes.md
a8-nursing-assessment.md
a9a-order-primitive.md
a9b-orderset-invocation.md
```

Each uses `PHASE-A-TEMPLATE.md` verbatim.

Current companion synthesis files:

```
a3-open-schema-entries-synthesis.md
a4-open-schema-entries-synthesis.md
```

These are staging artifacts for `OPEN-SCHEMA-QUESTIONS.md`; they are not
standalone Phase A deliverables.

### Cross-cutting files

```
SUMMARY.md
OPEN-SCHEMA-QUESTIONS.md
```

#### `SUMMARY.md` — required contents

1. **Artifact transposition matrix** — the single durable artifact of
   Phase A. Shape:

   | Legacy artifact | Agent-native transposition | Canonical primitive | Derived view | OpenLoop role |
   | --- | --- | --- | --- | --- |
   | Lab flowsheet | Time-series evidence substrate | observation | trend | unreviewed critical result |
   | MAR | Intent fulfillment ledger | action fulfilling intent | timeline, currentState(intents) | missed/held/refused dose |
   | Allergies tab | Constraint ledger with severity + reaction evidence | constraint event | currentState(axis: "constraints") | unsafe order blocked by active allergy |
   | Problem list | Problem assessments with supports evidence | assessment.subtype=problem | activeProblems() | active problem without recent assessment |
   | Home med list / med rec | Intent-layer reconciliation assessment | assessment over current medication intents | currentState(axis: "medications") | unresolved med-rec discrepancy at transfer |
   | … | … | … | … | … |

   Batch 0 and A4b rows are shown above as anchors for the researcher;
   the remaining rows populate from A1–A3, A5–A9b.

2. **Artifact → view primitive** matrix — which view consumes which
   artifact.

3. **Documentation rhythm** matrix — frequency × artifact × primary role.

4. **Included-field patterns** — across all fourteen artifacts, which
   types of fields consistently earn inclusion.

5. **Excluded-cruft patterns** — cross-cutting cruft categories.
   Usually reveals something deeper about legacy EHR design. (E.g.
   "most documentation artifacts contain redundant re-statement of
   patient identifiers per row — a legacy of paper-form inheritance.")

6. **`[verify-with-nurse]` queue** — one consolidated list across all
   artifacts, ready for project-owner review.

7. **Schema-impact ranking** — every slot proposal ranked by
   `schema_impact × (1/schema_confidence)`. High-impact low-confidence
   proposals sort to the top — those are what the owner scrutinizes
   first.

#### `OPEN-SCHEMA-QUESTIONS.md` — required contents

Grouped by source artifact. Each question uses the template-§16 shape:

```markdown
## A4. MAR

### Can one action fulfill multiple medication intents?

**Context:** A single administration may satisfy a scheduled order
instance, a PRN order, or a titration protocol.

**Options:**
1. One action → one intent (strict)
2. One action → many intents (permissive)
3. Introduce a medication-administration-episode object

**Researcher's lean:** Option 2 for v0.2, unless titration protocols
require episode grouping. Defer episode object to Phase B.
```

---

## 5. After Phase A

1. Project owner reviews the fourteen artifact files + `SUMMARY.md`.
2. Project owner resolves `OPEN-SCHEMA-QUESTIONS.md` — each resolution
   becomes an amendment to `DESIGN.md`. Batch 0's foundational
   questions (constraint lifecycle, advance-directive versioning,
   problem-resolution semantics) should resolve first because
   downstream artifacts' validators depend on them.
3. Project owner picks the **Phase B scenario** (likely septic shock
   from pneumonia, not pre-committed) based on what the slot shapes
   exercise most. Septic shock from pneumonia will exercise the
   constraints + problems + reconciliation layer heavily, which is one
   reason Batch 0 folds naturally into Phase B selection.
4. **Phase B** fetches scenario-specific content: orderset components,
   expected clinical trajectories, typical complications, expected
   labs/meds. This populates the slot shapes from Phase A with
   realistic values, including:
   - Realistic allergy profiles and code-status trajectories (A0b)
   - Realistic problem-list evolution across ICU stay (A0c)
   - Realistic home-med-to-inpatient reconciliation (A4b)
5. The importer and content layer combines, per ADR `decisions/001-mimic-to-synthea.md`:
   - **Synthea** for historical longitudinal data (primary importer)
   - **Hand-crafted + AI-assist** for narrative generation and
     scenario-specific ICU admission content
   - **Phase B scenario content** populates slot shapes with realistic
     orderset components, labs, meds, expected complications
   - **MIMIC-IV** remains deferred / optional — not blocking, pending
     clinical-reference-driven need for ICU-granularity density that
     Synthea cannot supply.

Together this produces one medically coherent ICU patient, with
fidelity adequate for pi-agent to do real work in the sandbox.

---

## 6. Execution modes

This directive can be executed by:

- **A deep-research agent** (Claude or otherwise) with web_search access.
  Charter + template + execution file loads into context; the agent
  drives through Batches sequentially, respecting the calibration stop.
- **Claude Code locally**, using its own research capabilities.
  Calibration stop is a commit boundary — project owner review is
  required before further Batch 2/3 expansion.
- **The project owner** (a nurse) executing Batches 2 and 3 directly
  from experience, with a research agent augmenting A0a–A0c, A1, A2,
  A4b, A8, A9a, A9b. Direct clinical experience compresses research
  time for the narrative and bedside-practice artifacts (A6, A7, A5,
  A3) while the research agent handles the constraint/primitive-design
  artifacts that benefit from regulatory citation and cross-reference.
- **Hybrid** — most likely in practice.

Regardless of mode, the calibration stop is non-negotiable.

---

## 7. Flight rules

Short reference for during-execution sanity checks.

1. **Drift check:** If an artifact file is > 5 pages (> 8 for A8/A9b),
   pause. Is it drifting into exhaustive EHR documentation?
2. **Cruft check:** If an artifact's `[cruft]` list is shorter than its
   `[clinical]` list, pause. In real EHRs, cruft outnumbers clinical.
3. **Agent-native check:** Re-read §2 (agent-native transposition)
   after writing the rest. Does the transposition still describe what
   you wrote? If not, either §2 or the rest is wrong.
4. **Primitive discipline check:** Did you propose a new event type?
   Re-read charter §3.3 (schema entropy budget). Can the payload go in
   an existing type instead?
5. **Canonical/derived check:** Any field where you were tempted to
   store "current X" or "latest X" — that's almost always **derived**,
   not canonical. *Especially* relevant for A0b ("active" allergies)
   and A0c ("current" problem list) — both are derived queries, not
   stored truth.
6. **Foundations-assumption check** *(new with Batch 0).* If writing a
   Batch 2 or Batch 3 artifact, re-read the relevant Batch 0 artifact
   before starting. Any read-before-write call in §12 that references
   constraints, problems, or patient context must point at a primitive
   actually defined in Batch 0, not at a convenient-sounding placeholder.

---

*End of execution plan. Three files total: charter, template,
execution. Together they constitute the Phase A research directive.*
