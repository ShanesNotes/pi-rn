# Per-patient shift-start workflow tracer

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Source issue: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/01-per-patient-shift-start-workflow-tracer.md`
Ralph context: `.omx/context/pi-chart-lean-v0-5-ralph-issues-01-02-20260504T145349Z.md`

## Purpose

This artifact locks the first real ICU nursing workflow spine for the lean v0.5 `pi-chart` shift-brain strategy. It describes the incoming critical care nurse's per-patient shift-start path from assignment selection through assessment charting, and names where the bounded in-chart assistant can help without becoming chart truth or autonomous completion authority.

The core product question remains:

> How can the chart and agent gather the right context at the right time to make the clinician maximally effective?

This is workflow/product strategy, not source implementation.

## Authority stance

- The human ICU nurse shift-start story is high-authority workflow evidence for this slice.
- The one-page report sheet is workflow/product evidence and visual scaffolding only.
- The report sheet is not a permanent medical record, canonical chart truth, UI mandate, storage shape, or API authority.
- Canonical memory remains chart facts, actions, notes, communications, artifact refs, evidence/provenance refs, source/authorship, timing, lifecycle, review, and attestation facts.
- Shift-start packet, report projection, mismatch prompts, care clusters, and shift-brain views are derived projections.
- The bounded in-chart assistant can summarize, cite, explain, suggest, and prompt review; it cannot silently accept writes, complete tasks, or decide canonical truth.

## End-to-end workflow tracer

### 1. Start assignment context

The incoming nurse completes login and selects assigned patients.

Clinical purpose:

- establish patient and encounter scope;
- prevent cross-patient context bleed;
- make every report, chart-digging packet, workflow item, and assistant prompt patient-scoped.

Projection needs:

- selected patient/encounter;
- as-of chart time;
- assignment context when available;
- current location/room;
- confidence that subsequent views are confined to that patient.

Assistant usefulness:

- confirm the visible patient/encounter frame;
- avoid surfacing context from other patients;
- summarize only within the selected patient scope.

### 2. Receive nurse-to-nurse report

The incoming nurse sits down with the offgoing nurse and receives report about what happened overnight or during the prior shift.

Clinical purpose:

- inherit the offgoing nurse's situational awareness;
- capture what changed, what remains unresolved, what is risky, and what needs watchfulness;
- hear practical bedside details that may not be obvious from chart views alone.

Separate channels:

| Channel | What it is | Authority posture |
| --- | --- | --- |
| Heard in report | Offgoing nurse verbal handoff | Important workflow evidence; not automatically chart truth |
| Seen on report sheet | One-page visual scaffold | Derived/product evidence; not permanent medical record |
| Read in chart | H&P, notes, vitals, I&O, labs, tasks, MAR/orders | Canonical facts or projections over canonical facts depending on surface |
| Verified at bedside | Medication check, monitor check, patient observation | Observable clinical reality that may need sanctioned charting |

Assistant usefulness:

- keep the handoff organized around patient-specific categories;
- identify source links that support or qualify report claims;
- flag mismatches as review prompts, not truth declarations.

### 3. Use one-page report visual as attention scaffold

The Corewell ICU nursing report visual shows the kind of one-page structure nurses use while receiving handoff. Useful attention categories include:

- code status;
- isolation/precautions;
- consults and coverage;
- allergies;
- admission date/context;
- principal problem;
- relevant history;
- neurological status and pain/sedation context;
- pulmonary status and oxygen/device context;
- cardiovascular goals and hemodynamic state;
- gastrointestinal/genitourinary context;
- drips, infusions, and medication context;
- wounds/skin issues;
- mobility and fall risk;
- lines, tubes, drains, and access sites;
- abnormal latest results;
- to-do items;
- family/social context;
- safety checks.

Projection contract:

- project these categories from canonical chart facts/actions/notes/refs when available;
- show missing or report-only items as source-needing prompts rather than canonical facts;
- avoid making the paper/form layout a required UI shape.

Assistant usefulness:

- explain why each attention category matters now;
- provide source links for projected entries;
- identify categories with stale, missing, or conflicting evidence.

### 4. Skim H&P for why the patient is here

During report, the incoming nurse may open the H&P and briefly skim why the patient is admitted.

Clinical purpose:

- understand admitting problem and baseline context;
- distinguish chronic background from current shift priorities;
- interpret current vitals/labs/therapy against the original illness story.

Hot/warm/cold behavior:

- H&P is usually cold/background context;
- selected admitting problem or baseline constraints can become warm supporting context;
- only explicitly current, safety-relevant facts should become hot current-care context.

Assistant usefulness:

- provide a short, source-linked admission-reason summary;
- cite the H&P and avoid making summary text canonical;
- distinguish original admission context from current ICU plan.

### 5. Skim most recent ICU note

The nurse may read the most recent ICU note from the prior day's rounds.

Clinical purpose:

- understand current provider plan;
- identify active problems, goals, pending studies, medication strategy, ventilator/hemodynamic plan, and anticipated trajectory;
- compare the note's plan with report and current bedside status.

Projection needs:

- most recent relevant provider note;
- plan/problems mentioned in note;
- timestamp and author;
- links to orders, labs, diagnostics, meds, and current-state projections when possible.

Assistant usefulness:

- summarize the current plan in plain language;
- link note statements to supporting or conflicting chart facts;
- prompt review if the note plan appears stale relative to new overnight events.

### 6. Review vitals trends

The nurse opens vitals trends to see whether anything needs attention.

Clinical purpose:

- detect physiologic trajectory, instability, or improvement;
- compare report with charted trend;
- decide whether bedside verification or urgent action is needed.

Projection needs:

- latest valid vitals;
- short trend window relevant to shift start;
- invalid-sample suppression or caveats;
- oxygen/device context where relevant;
- blood pressure goals when charted.

Assistant usefulness:

- explain notable trend changes in plain language;
- cite time windows and source facts;
- avoid alarmist language for routine variation;
- prompt review for critical or inconsistent values.

### 7. Verify drips and dose-rate context

During report and vitals review, the nurse checks whether documented drip/dose rates match what the offgoing nurse reports.

Clinical purpose:

- prevent medication/hemodynamic mismatch;
- understand current pressor/sedation/insulin/anticoagulation or other infusion context;
- decide whether bedside medication verification is urgent.

Projection needs:

- active infusions/drips;
- current documented dose/rate and timestamp;
- source of dose/rate information;
- linked orders/MAR/actions where available;
- target goals such as MAP/BP goals when charted.

Assistant usefulness:

- show the latest documented rate with timestamp and source;
- compare report text/claim against charted rate if represented;
- prompt bedside verification if chart/report/monitor context conflicts;
- never mark a medication task complete or corrected autonomously.

### 8. Review I&O and fluid balance

The nurse opens I&O to look at patient fluid balance.

Clinical purpose:

- understand net balance, urine output, drain output, intake, diuresis/resuscitation context, and renal/hemodynamic implications;
- connect volume status to labs, vitals, drips, and plan.

Projection needs:

- recent interval balance;
- shift and encounter net balance when useful;
- urine output/drain output categories when charted;
- source/time caveats and missing-data indicators;
- links to orders, devices, and assessments where relevant.

Assistant usefulness:

- summarize trend direction and potential relevance;
- show uncertainty when I&O intervals are incomplete;
- avoid over-interpreting balance without clinical source support.

### 9. Review lab trends

The nurse opens the lab values flowsheet to review trends.

Clinical purpose:

- detect abnormal, worsening, improving, pending, corrected, or unreviewed results;
- connect labs to current plan, medications, renal function, infection, bleeding, electrolytes, and other nursing priorities.

Projection needs:

- latest abnormal and clinically relevant labs;
- short serial trend;
- result status/review state when available;
- source/effective/recorded time;
- links to orders, review actions, and notes where relevant.

Assistant usefulness:

- summarize clinically meaningful trends in plain language;
- distinguish result fact from review action;
- flag critical unreviewed or conflicting results as review prompts.

### 10. Check work list/task list

The nurse checks the work list or task list for pending actions such as lab draws or nursing-specific work.

Clinical purpose:

- identify open obligations that could be missed after report;
- understand what is due now, due soon, routine, blocked, deferred, or handoff/watch.

Projection needs:

- source and authority of each item;
- due window;
- completion criteria;
- evidence/source links;
- defer/block/carry-forward state;
- priority tier.

Assistant usefulness:

- explain why an item is on the list;
- group items by clinical risk and timing;
- suggest review or clustering;
- avoid punitive language and autonomous completion.

### 11. Bedside introduction and verification

The nurse goes into the room, introduces themself, verifies medications, and looks at the vitals monitor.

Clinical purpose:

- reconcile chart/report context with bedside reality;
- identify urgent changes that should interrupt the plan;
- establish patient presence and safety.

Projection needs:

- bedside verification prompts for meds/drips and monitor values;
- critical mismatch prompts if report/chart/bedside conflict;
- quiet handling when nothing urgent requires action.

Assistant usefulness:

- provide a concise checklist of what to verify;
- elevate only immediate safety issues;
- phrase prompts neutrally: "review priority" or "needs attention," not blame.

### 12. Plan early med pass and cluster first assessment

If nothing urgent needs attention, the nurse returns to the computer and plans the day around medications. The first assessment may be clustered with 8, 9, or 10 o'clock meds, often around 8:30 when clinically appropriate.

Clinical purpose:

- reduce room entries;
- align medication administration and assessment workflow;
- preserve clinician judgment around timing, acuity, and appropriateness.

Projection needs:

- due meds and safe timing windows;
- assessment cadence;
- compatible tasks for clustering;
- incompatibilities or safety-critical exceptions;
- defer/block/carry-forward options.

Assistant usefulness:

- suggest possible clusters with rationale;
- respect urgency and incompatibilities;
- allow the nurse to accept, modify, or ignore cluster suggestions;
- avoid implying that a different order is wrong when clinical judgment supports it.

### 13. Chart assessment after performed care

The nurse charts the assessment after completing bedside assessment and medication administration.

Clinical purpose:

- record care actually performed;
- preserve timing, source, author, and clinical observation;
- avoid precharting or agent-authored completion.

Projection needs:

- clear link from performed assessment to source/authorship/time;
- optional reminders for missing required charting;
- no automatic completion unless explicitly modeled chart evidence supports a specific fact and a human accepts/records it.

Assistant usefulness:

- suggest documentation prompts based on performed workflow;
- cite what was planned and what remains unresolved;
- never silently write or complete the assessment.

## Mismatch prompt inventory

Mismatches should be surfaced as review prompts, not autonomous truth decisions.

| Mismatch | Example prompt posture | Human-owned resolution |
| --- | --- | --- |
| Report vs charted drip rate | "Reported norepinephrine rate differs from latest charted MAR rate; review before med pass." | Nurse verifies bedside/MAR and charts/corrects through sanctioned workflow |
| ICU note vs overnight events | "Latest ICU note plan may predate overnight hypotension; review current vitals and orders." | Clinician interprets and updates care as appropriate |
| Vitals trend vs bedside monitor | "Bedside monitor appears different from charted trend; verify current value/source." | Nurse validates/records if needed |
| I&O incomplete interval | "Fluid balance window may be incomplete; review I&O entries before using net balance." | Nurse confirms documentation or treats as uncertain |
| Lab result vs review state | "Critical/abnormal result appears unreviewed; review result and linked actions." | Human reviews/acts/charts |
| Task list vs performed care | "Task remains open but evidence may suggest related care occurred; confirm before closing." | Human completes or leaves open |

## Verification prompts for later slices

A future implementation or prototype should be testable by walking this sequence:

1. Select patient and confirm patient/encounter scope.
2. Open report projection and see source-linked high-attention categories.
3. Skim H&P admission reason summary with source link.
4. Skim most recent ICU note plan summary with timestamp/author.
5. Review vitals trends with latest/current and short trend windows.
6. Review active drips/dose rates with source/time and goals.
7. Review I&O/fluid balance with interval caveats.
8. Review lab trends with result/review distinction.
9. Review task list with source/authority/due/completion fields.
10. Enter room and verify medications plus monitor state.
11. Receive mismatch prompts only when source disagreement or safety risk exists.
12. Plan med pass and optional care cluster around first assessment.
13. Chart assessment after care; no autonomous agent completion.

## Boundary closeout

- [x] Docs-only artifact.
- [x] No source implementation edits authorized.
- [x] No backend/vector/OpenBrain/storage/runtime/access-plane decision.
- [x] No `pi-ledger` kernel expansion.
- [x] No hidden `pi-sim` internals.
- [x] No direct agent accepted-writes.
- [x] No autonomous task completion.
- [x] Nonpunitive, clinician-supportive workflow framing preserved.
