# ADR 006 — Closed `source.kind` taxonomy

- **Status:** proposed (awaiting owner approval)
- **Date:** 2026-04-20
- **Deciders:** Shane (operator)
- **Touches:** DESIGN §1 (envelope), §5.7 (import provenance), CLAIM-TYPES, validator
- **Source convergence:** foundation hole-poke C1; autoresearch P6 (semantic profile registry precursor); A1 §10 + A2 §10 each propose new values

## Revisions

- **2026-04-21 (operator review pass 2):** Three tightenings.
  (1) v0.3 error-promotion trigger concretized — the warn→error
  promotion fires after all Phase A Batch 2 fixtures land and pass
  validation under the warn-only rule, not on a calendar date.
  (2) `clinician_chart_action` is role-agnostic by design;
  provider / APP / RN / RT / PharmD differentiation lives on
  `author.role`, not on `source.kind`. (3) `agent_review` seed
  audit added to §Consequences — A1/A2 drafts may have used
  `agent_inference` for review actions; audit and migrate during
  ADR implementation. The canonical registry table now lives in
  DESIGN §1.1 (added in pass 1 of review via DESIGN.md edit); this
  ADR remains the rationale document.

## Context

`source.kind` is a free-form string today. Values currently in circulation across docs and drafts:

- **Runtime:** `monitor_extension`, `patient_statement`, `admission_intake`, `nurse_charted`
- **Agent:** `agent_inference`, `agent_reasoning` (difference never defined)
- **Import:** `synthea_import`, `mimic_iv_import`
- **A1 additions:** `lab_analyzer`, `lab_interface_hl7`, `poc_device`, `manual_lab_entry`
- **A2 additions:** `pacs_interface`, `dictation_system`, `pathology_lis`, `cardiology_reporting`, `endoscopy_reporting`, `clinician_chart_action`, `agent_review`, `protocol_standing_order`

Problems:
1. No authoritative list. Docs enumerate partial subsets.
2. `agent_inference` vs `agent_reasoning` has no definition — drift via
   copy-paste.
3. No validator check. A typo (`monitor_extention`) is silently
   accepted and invalidates downstream provenance queries.
4. Import provenance (invariant 9) depends on `source.kind` being
   well-known — unknown values bypass the invariant.
5. Autoresearch P6 identifies this as a precursor to a broader profile
   registry.

## Decision

**Closed taxonomy in DESIGN §1.1; validator warn-on-unknown in
v0.2, promote to error after Phase A Batch 2 fixtures land and
pass validation under the warn-only rule.** Schema remains
permissive (string) so importers can register new kinds via doc
amendment without a schema bump. The promotion trigger is
fixture-driven (not calendar-driven): warn stays warn until there
is durable evidence that every authored fixture uses a canonical
kind, at which point the warn→error flip is safe.

### Canonical taxonomy (v0.2 + A1/A2 anticipations)

Grouped by origin family.

| Group              | `source.kind`              | Meaning                                                                 |
|--------------------|----------------------------|-------------------------------------------------------------------------|
| **Patient-origin** | `patient_statement`        | Patient or surrogate self-report at bedside or via portal.              |
| **Clinician-origin** | `admission_intake`       | Structured admission H&P data; written by intake clinician.             |
|                    | `nurse_charted`            | Nurse-authored at the chart (observations, assessments, notes).         |
|                    | `clinician_chart_action`   | Clinical chart interaction (order entry, result review, note). Role-agnostic by design — `author.role` differentiates provider / APP / RN / RT / PharmD. |
|                    | `protocol_standing_order`  | Clinician action under a standing protocol (RN titration, RT weaning, pharmacy dosing). |
| **Device-origin**  | `monitor_extension`        | pi-sim or equivalent live monitor ingest extension.                     |
|                    | `poc_device`               | Bedside point-of-care device (iSTAT, Accu-Chek, ACT, POCUS probe).      |
|                    | `lab_analyzer`             | Direct lab instrument interface (rare in routine flow).                 |
| **Interface-origin** | `lab_interface_hl7`      | LIS → chart via HL7 ORU (standard lab result path).                     |
|                    | `pacs_interface`           | PACS/RIS → chart interface (imaging metadata + pointers).               |
|                    | `dictation_system`         | Dictation/transcription system feed (radiology, pathology, clinic notes). |
|                    | `pathology_lis`            | Pathology LIS (anatomic and clinical pathology reports).                |
|                    | `cardiology_reporting`     | Cardiology reporting system (echo, cath, EP).                           |
|                    | `endoscopy_reporting`      | Endoscopy reporting system.                                             |
|                    | `manual_lab_entry`         | Result transcribed manually (outside-hospital result, faxed, phoned-in).|
| **Agent-origin**   | `agent_inference`          | Agent-authored conclusion drawn from observed chart data (assessment, trend, differential). |
|                    | `agent_reasoning`          | **Collapsed into `agent_inference`.** Retained as a synonym; validator warns and suggests migration. |
|                    | `agent_review`             | Agent-authored `action.result_review` (may require human confirmation, see ADR 002 status draft). |
| **Import-origin**  | `synthea_import`           | Synthea-generated historical corpus (primary per ADR 001).              |
|                    | `mimic_iv_import`          | MIMIC-IV historical corpus (optional-later per ADR 001).                |
|                    | `manual_scenario`          | Hand-authored scenario fixture (teaching cases, Phase A fixtures).      |

### Structured `source` shape (unchanged)

`source` remains `{ kind, ref?, ... }`. Kind-specific fields are
documented per-kind in CLAIM-TYPES (e.g., `lab_interface_hl7` carries
`system`, `verified_by`, `raw_ref?`; `synthea_import` carries
`generator_version`, `seed`, original-ids). Import-origin kinds are
already required by invariant 9 to carry structured provenance fields.

### Validator changes

- **V-SRC-01 (v0.2 = warn; promotes to error).** `source.kind`
  must match an entry in the DESIGN §1.1 taxonomy. Warn on unknown
  in v0.2. Promotion to error fires after Phase A Batch 2 fixtures
  land and pass validation under the warn-only rule (fixture-
  driven, not calendar-driven).
- **V-SRC-02.** `source.kind: agent_reasoning` is accepted but emits
  a migration notice pointing to `agent_inference`. Remove in v0.3.
- **V-SRC-03.** Import-origin kinds (`synthea_import`, `mimic_iv_import`)
  must carry their required structured provenance fields (invariant 9).

### Extending the taxonomy

New kinds are added by:
1. ADR amendment referencing the origin family and reason.
2. Update the DESIGN §1 table.
3. Add a kind-specific row to CLAIM-TYPES.
4. Validator picks up the new value automatically (table-driven).

No schema change required; this is the whole point of (b) over a
schema-level enum.

## Tradeoffs

| Axis                                  | (a) Schema-level enum      | (b) DESIGN enum + validator warn (chosen) | (c) Open string (status quo) |
|---------------------------------------|----------------------------|-------------------------------------------|------------------------------|
| Typo detection                        | immediate, at write        | at validate                               | never                        |
| Cost to register a new kind          | schema bump + migration    | ADR + doc edit                            | zero (and zero meaning)      |
| Discoverability                       | schema                      | one DESIGN table                          | scattered across docs        |
| Breakage risk when new values appear | schema-breaking             | non-breaking (warn)                       | non-breaking                 |
| Meaning stability                     | enforced                    | enforced via ADR discipline               | none                         |

(b) matches how `schema_version` should work (rare bumps) while
keeping everyday registration cheap.

## Consequences

- **DESIGN.md §1** — add the `source.kind` taxonomy table above as
  a subsection. Cross-reference from envelope table.
- **DESIGN.md §5.7** — import provenance examples reference the
  closed list.
- **CLAIM-TYPES.md** — adds a short §"`source.kind` registry" pointer
  to DESIGN §1, plus per-kind field conventions for the interface-origin
  and import-origin kinds.
- **src/validate.ts** — V-SRC-01/02/03 as above; taxonomy loaded from a
  data table (not hardcoded) so the ADR-amendment pattern works.
- **Seed `patient_001`** — audit for any events using `agent_reasoning`
  or undocumented kinds. Migrate during implementation ADR follow-up.
- **A1/A2 draft fixtures** — audit for `agent_review` vs
  `agent_inference` usage on `action.result_review` events. A1/A2
  drafts predate this ADR's split between the two; any review
  action tagged `agent_inference` should migrate to `agent_review`
  during ADR implementation. Tracked alongside the seed audit.

## Not decided here

- Whether `clinician_chart_action` should split by role
  (`provider_chart_action`, `rn_chart_action`, `rt_chart_action`). A2
  proposes the split; A1 does not. Defer to a subtype-level decision
  inside CLAIM-TYPES rather than a kind-level one.
- Whether `protocol_standing_order` collapses with
  `clinician_chart_action` when the protocol is recorded as
  `data.authority`. Lean: keep separate for now; audit after A4 (MAR)
  and A9b (ordersets).
- Whether patient-portal ingestion ("patient sent a message via the
  portal") warrants a distinct kind. Defer until a portal pathway is
  actually modeled.
