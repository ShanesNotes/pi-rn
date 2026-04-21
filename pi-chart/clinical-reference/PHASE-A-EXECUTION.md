# pi-chart Phase A Execution Plan

**Revision:** v3.1. The sequenced work plan for Phase A. A researcher drives
through this file top to bottom.

**v3.1 changes from v3:** output location moved to
`clinical-reference/phase-a/`; §5 updated to reflect ADR 001
(Synthea-primary, MIMIC deferred).

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

Research proceeds in three batches, strictly ordered. A calibration stop
separates Batch 1 from Batch 2 — do not skip it.

### Batch 1 — Calibration (2 files)

| ID  | Artifact                                            |
| --- | --------------------------------------------------- |
| A1  | Lab results flowsheet                               |
| A2  | Results review (imaging / tests / procedures)       |

### Batch 2 — Main (5 files)

| ID  | Artifact                                            |
| --- | --------------------------------------------------- |
| A3  | Vital sign flowsheet                                |
| A4  | MAR (Medication Administration Record)              |
| A5  | Intake & Output + Lines/Tubes/Drains (LDAs)         |
| A6  | Provider notes (H&P, progress, consult, rounding)   |
| A7  | Nursing notes                                       |

### Batch 3 — Heavy (3 files, A9 split)

| ID   | Artifact                                   |
| ---- | ------------------------------------------ |
| A8   | ICU nursing assessment (head-to-toe)       |
| A9a  | Individual order primitive                 |
| A9b  | Orderset invocation model                  |

---

## 2. Calibration stop — mandatory, between Batch 1 and Batch 2

After A1 and A2 are produced, **stop and wait for project-owner review.**

Do not start A3 until calibration passes.

### Why the stop matters

A1 (labs) and A2 (results review) are deceptively simple. They map
cleanly to existing Synthea data and existing pi-chart types, which
makes it easy to produce outputs that *look* correct but have quietly
drifted toward EHR-clone territory.

A1/A2 calibrate four things:

1. **Template depth.** Are all 17 sections filled with substance, or are
   some thin/generic?
2. **Agent-native transposition language.** Does §2 describe what the
   artifact *becomes*, or does it describe the artifact in EHR terms?
3. **Cruft discipline.** Are excluded fields documented with "why it
   exists"? Is the cruft list specific, not generic?
4. **Decision-test rigor.** Does every included field have a concrete
   "what fails if absent?"

### Calibration test — A1 and A2 should demonstrate

A1/A2 are the easiest artifacts, but they should exercise the full
pi-chart pattern end to end:

```
result arrives (observation) →
  result is represented (canonical event, structured values) →
  result is reviewed (action.subtype = result_review) →
  result supports reasoning (assessment links via supports) →
  result triggers follow-up (intent) or closes a loop (openLoop
  resolution) →
  result may be amended (supersession lifecycle)
```

If the A1/A2 outputs only produce field inventories — even thorough ones
— the template is not working yet. Revise before continuing.

### Calibration review checklist (project owner)

Before approving Batch 2 start:

- [ ] §2 is function-first, not form-first
- [ ] §7 has `what fails if absent?` answered concretely for every row
- [ ] §7 has `sourceability` answered for every row
- [ ] §8 has "why it exists" for every cruft entry
- [ ] §9 separates canonical / derived / rendered cleanly
- [ ] §11 proposes concrete staleness→openLoop links
- [ ] §12 lists specific view calls, not "read the chart"
- [ ] §14 uses existing primitives where possible; new proposals have
  `schema_impact` flags
- [ ] §15 has at least one validator rule
- [ ] `OPEN-SCHEMA-QUESTIONS.md` has been populated with any
  `[open-schema]` items

If any checkbox fails, the researcher revises A1/A2 before Batch 2.

---

## 3. Batch execution rules

### Within-batch

- One artifact per pass. Do not parallelize across batches.
- Within a batch, artifacts may be produced in any order.

### Output budgets (from charter §7)

- **Batch 1 & 2 artifacts:** 3–5 pages, 8–20 fields, up to 10 cruft
  entries, up to 5 regulatory anchors, up to 5 open questions.
- **A8, A9b:** 6–8 pages, open-question ceiling removed for A9b.

### Permitted A9 split

A9 may split into A9a (individual order primitive) and A9b (orderset
invocation model). An individual order is a straightforward `intent`
event. Orderset invocation is a schema-design question — how does
selecting a template produce N linked child intents? Treat them as
separate artifacts.

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
a1-lab-results.md
a2-results-review.md
a3-vital-signs.md
a4-mar.md
a5-io-and-ldas.md
a6-provider-notes.md
a7-nursing-notes.md
a8-nursing-assessment.md
a9a-order-primitive.md
a9b-orderset-invocation.md
```

Each uses `PHASE-A-TEMPLATE.md` verbatim.

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
   | … | … | … | … | … |

2. **Artifact → view primitive** matrix — which view consumes which
   artifact.

3. **Documentation rhythm** matrix — frequency × artifact × primary role.

4. **Included-field patterns** — across all nine artifacts, which types
   of fields consistently earn inclusion. (E.g. "context modifiers on
   observations appear in every flowsheet artifact.")

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

1. Project owner reviews the ten artifact files + `SUMMARY.md`.
2. Project owner resolves `OPEN-SCHEMA-QUESTIONS.md` — each resolution
   becomes an amendment to `DESIGN.md`.
3. Project owner picks the **Phase B scenario** (likely septic shock
   from pneumonia, not pre-committed) based on what the slot shapes
   exercise most.
4. **Phase B** fetches scenario-specific content: orderset components,
   expected clinical trajectories, typical complications, expected
   labs/meds. This populates the slot shapes from Phase A with
   realistic values.
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
  Calibration stop is a commit boundary — project owner reviews before
  A3 starts.
- **The project owner** (a nurse) executing Batches 2 and 3 directly
  from experience, with a research agent augmenting A1, A2, A8, A9a,
  A9b. This is often the fastest path because direct clinical
  experience compresses research time for the narrative artifacts
  (A6, A7).
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
   not canonical.

---

*End of execution plan. Three files total: charter, template,
execution. Together they constitute the Phase A research directive.*
