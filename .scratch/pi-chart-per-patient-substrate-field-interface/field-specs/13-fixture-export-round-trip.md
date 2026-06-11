# Field spec 13 — fixture + export round-trip

Status: completed
Parent: `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`
Issue: `issues/13-eventenvelope-ndjson-markdown-fixture-export-round-trip.md`
Posture: `adopt`

## Authority (ADR 018 §4)

Brownfield NDJSON+Markdown layout is **fixture/export/archive format** — not field-contract authority, not adapter source of truth.

Generated UI, design assets, prototypes, report visuals are **not** substrate authority (report visuals = evidence).

## On-disk layout

```
pi-chart/patients/<patientId>/timeline/<YYYY-MM-DD>/
  events.ndjson
  vitals.jsonl
  notes/<HHMM>_<slug>.md
  encounter_<NNN>.md
```

## Crosswalk summary

### EventEnvelope → `events.ndjson`

Key export fields: `id, type, subtype, subject, encounter_id, effective_at, recorded_at, author, source, certainty, status, data, links`.

Maps to contract fields per Issues 01–10. Gaps: `integrity` absent; `revises` lacks target Record hash.

### VitalSample → `vitals.jsonl`

Key export fields: `sampled_at, recorded_at, sample_key, subject, encounter_id, source, name, value, unit, quality`.

Gaps: no `id`; no lifecycle/certainty/evidence.

### NoteFrontmatter → `notes/*.md`

Gaps: `references: string[]` must converge on `EvidenceRef` (Issue 07).

## Round-trip assertion

- `patient_001` — regression: contract fields present in fixture round-trip export ↔ contract
- `patient_002` / `enc_p002_001` — demo: same guarantee

Named gaps are marked, not fabricated.

## Scaling

Export is fixture/archive, not at-scale runtime store. Per-patient/per-day partition keeps fixtures shardable. Runtime store = clinical-truth service (ADR-promoted).

## Open questions

- Lossy-export policy (which fields may be absent)
- Zoned-time in export vs canonical-at-rest
- `VitalSample.id` / `sample_key` promotion

## Out of scope

Source edits, fixture migration, brownfield rewrite, kernel widening.