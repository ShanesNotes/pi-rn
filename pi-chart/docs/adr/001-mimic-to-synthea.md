# ADR 001 — Historical data source: MIMIC-IV → Synthea

- **Status:** accepted
- **Date:** 2026-04-20
- **Deciders:** Shane (operator)
- **Supersedes:** implicit MIMIC-IV assumption in DESIGN.md §5

## Context

pi-chart's load-bearing principle (DESIGN §1) is that historical and
runtime data share one envelope stream — MIMIC-IV labs and pi-sim
vitals differ only in `source.kind`, `effective_at`, and `recorded_at`.
The original plan (DESIGN §5) was MIMIC-IV as the historical corpus.

Two problems surfaced:

1. **Access friction.** MIMIC-IV requires credentialed access (CITI
   training, data use agreement, institutional sign-off). The timeline
   to obtain a usable CSV stage is not days, and the gate is external.
2. **Maturity mismatch.** pi-chart is still converging on what "a
   realistic chart looks like" at a clinical-content level. Importing
   cohort-scale real data into a substrate whose conventions are still
   moving produces churn in the importer, not in the substrate.

The operator's clinical grounding (ICU RN) also means hand-crafted and
Synthea-seeded patients can be validated for realism locally, without
waiting on MIMIC.

## Decision

**Pivot Phase 3 from MIMIC-IV ingestion to Synthea.**

- Historical corpus source is [Synthea](https://github.com/synthetichealth/synthea)
  (open, no credentialing).
- `source.kind` for imported claims becomes `synthea_import` (alongside
  the existing `monitor_extension`, `patient_statement`, `agent_*`).
- Import code lives at `src/importers/synthea/`, mirroring the structure
  originally spec'd for MIMIC at DESIGN §5.
- `_imports/synthea/manifest.yaml` per patient records the import
  provenance (Synthea version, seed, generation parameters, mapping
  rules applied).
- Envelope primitive does not change. Patient isolation, supersession,
  fulfillment typing, evidence refs all remain identical.

## Tradeoffs

| Axis                          | MIMIC-IV                        | Synthea                                |
|-------------------------------|---------------------------------|----------------------------------------|
| Clinical realism              | high (real patients)            | moderate (synthetic; known gaps)       |
| Access friction               | high (credentialing)            | none                                   |
| Cohort scale                  | very high                       | arbitrary (generator)                  |
| ICU-specific depth            | strong (ICU CCU labs, waveforms)| weaker (Synthea is outpatient-biased)  |
| Determinism for tests         | replay only                     | seed-reproducible                      |
| Legal / data-use              | DUA required                    | unrestricted                           |

Accepted costs:

- **Lower clinical realism per patient.** Mitigated by hand-crafting
  ICU-specific flowsheet content on top of Synthea demographics/history,
  and by the operator's ICU-nursing validation loop.
- **Weaker ICU coverage out-of-the-box.** Synthea's ICU models are
  thinner than MIMIC's. We accept that early charts will be
  operator-authored for the acute portion; Synthea seeds the baseline
  (PMHx, meds, allergies, prior encounters).

## Consequences

- DESIGN §5 needs a revision pass to replace "MIMIC-IV ingestion" as
  the canonical Phase 3 subject. MIMIC-IV support becomes a
  *later-deferrable* option, not the primary path.
- ROADMAP Phase 3 is re-scoped to Synthea.
- `_imports/pi-chart-v0.1-spec.md` and `_imports/pi-chart-scaffold-optimizations.md`
  references to MIMIC remain as historical context but are not binding.
- Re-opening MIMIC later does not require structural changes — it is
  another `source.kind` + another importer directory. The substrate is
  unchanged. Primitives (DESIGN §1) are untouched.

## Not decided here

- Specific Synthea → pi-chart envelope mapping (encounter structure,
  condition granularity, medication rendering). Owned by the Phase 3
  importer work.
- Whether to keep any MIMIC-IV stub in the importers directory now
  (default: no — YAGNI).
- How much of the ICU flowsheet layer is operator-authored vs.
  generated. Deferred to the Track A clinical-reference work
  (ROADMAP §"Current focus").
