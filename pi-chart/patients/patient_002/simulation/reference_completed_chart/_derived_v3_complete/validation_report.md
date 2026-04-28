# Validation report — patient_002 v3

## Validator results
```json
{
  "event_count": 247,
  "vitals_rows": 80,
  "note_refs": 32,
  "artifact_refs": 9,
  "failures": [],
  "warnings": [],
  "pass": true
}
```

Run from the patient root with:
```bash
node scripts/validate-chart.mjs
```

## What changed from v2

### Deep historical chart added
Five pre-admission encounters with their own directories under
`timeline/`:

- **2022-08-03** — `enc-002-h001`, 5-day inpatient admission. New
  HFpEF diagnosis from a presentation of dyspnea and lower-extremity
  edema; initial echo (EF 58%, grade 2 diastolic dysfunction);
  cardiology consult establishing the outpatient relationship; HCP
  form filed; 20 events; cardiology consult note and discharge
  summary.
- **2024-03-15** — `enc-002-h002`, nephrology follow-up; CKD 3a
  stable; UACR persistently mildly elevated; SGLT2i recommended; 6
  events; visit note.
- **2024-09-10** — `enc-002-h003`, PCP annual; 6 events; visit
  note; PCV20 administered in clinic.
- **2025-08-05** — `enc-002-h004`, cardiology follow-up with
  point-of-care echo (EF 58%, grade 1 — diastolic improved from
  2022); 5 events; visit note.
- **2025-09-15** — `enc-002-h005`, most recent PCP annual before
  admission; 9 events; visit note; ACP discussion declined; 2025-26
  COVID booster administered.

### New historical artifacts
- `art-002-img-005` — 2025-08-05 echo report.
- `art-002-img-006` — 2022-08-04 echo (HFpEF diagnostic study).
- `art-002-imm-001` — full immunization registry record.
- `art-002-lab-005` — A1c trajectory (2009 dx → 2025).
- `art-002-lab-006` — Cr/eGFR/UACR longitudinal, including the
  current admission AKI arc.
- `art-002-lab-007` — lipid trajectory (pre-statin → on
  atorvastatin).
- `art-002-lab-008` — BNP and outpatient BP across years.

### Current-admission depth additions
- `evt-002-0149` — pre-intubation family meeting with husband (HCP).
- `evt-002-0150–0151` — famotidine SUP order, insulin regular SS
  order with full scale.
- `evt-002-0152–0158` — explicit hold/continue decisions for each
  home medication (metformin, losartan, amlodipine, furosemide
  → hold; aspirin, atorvastatin, omeprazole → continue) with
  rationale and reassessment criteria on each.
- `evt-002-0159, 0174` — VTE prophylaxis decision and SCDs interval.
- `evt-002-0160–0173` — q4h fingerstick glucose checks and matched
  insulin admin events through admission day, plus the famotidine
  q24h admin events.
- `evt-002-0165, 0167` — cardiology consult request and consult note
  by the patient's outpatient cardiologist who has known her since
  2022.
- `evt-002-0166, 0169` — nephrology consult request and consult
  note by the patient's outpatient nephrologist.
- `evt-002-0168` — admission BNP (1245), with cross-reference to
  the longitudinal BP/BNP trajectory.
- `evt-002-0175, 0181, 0182, 0188, 0200, 0201` — chronic-med
  continuation events via OG and then PO post-extubation
  (atorvastatin, aspirin, omeprazole).
- `evt-002-0183, 0198` — daily family update notes from RN and from
  attending.
- `evt-002-0184, 0185` — nutrition consult request and dietitian
  consult note.
- `evt-002-0186, 0187` — explicit norepinephrine rate-decrease
  events on day 2 (0.05 → 0.04 → 0.03).
- `evt-002-0191, 0193` — SLP consult request and bedside swallow
  evaluation note.
- `evt-002-0192, 0194` — PT/OT consult request and initial
  evaluation note.
- `evt-002-0195, 0196, 0199` — heparin SC q8h initiation on day 3
  once stable, with two admin events.
- `evt-002-0197` — case management discharge planning note.

### Validator changes
- Now scans every `timeline/<date>/events.ndjson` directory rather
  than only the three current-admission day folders. New encounter
  directories are picked up automatically.
- Citation regex extended to recognize `evt-002-h00X-NNN` historical
  event IDs so cross-encounter citations (e.g., a current-admission
  note citing the 2025 echo) are validated.
- `projectionAsOf` filename regex generalized to also match
  `current_state_*` and `open_loops_*` derived files.

### Conventions doc additions
A new "Historical-encounter rules" section documenting the encounter
naming scheme, event ID prefix, directory layout, and validator
behavior.

## Counts vs v2

|                | v2  | v3  |
|----------------|-----|-----|
| Files          | 48  | 90  |
| Events         | 148 | 247 |
| Notes          | 17  | 32  |
| Artifact refs  | 3   | 9   |
| Encounters     | 1   | 6   |

## Known not-addressed issues from v2 review
The v2 review surfaced these items as schema/modeling concerns; v3
focused on clinical depth rather than schema cleanup, so these
remain pending and are intentionally **not** changed in v3:

- `evt-002-0109` is still a dummy "status=off" vasoactive segment.
- `evt-002-0148` (droplet isolation discontinued) still uses
  `addresses → evt-002-0003` (sepsis problem) rather than addressing
  an isolation constraint that is not yet event-modeled.
- `evt-002-0087` (KCl repletion) still `addresses` a lab result
  rather than an assessment event; `evt-002-0131` (abx narrowing)
  still `addresses` a consult note rather than a problem.
- The respiratory viral panel result (`evt-002-0147`) still has a
  ~50-hour turnaround from collection (`evt-002-0146`).

## Pending for next iteration
- Promote the ventilator FiO2 wean (1.0 → 0.6 → 0.5 → 0.4) into
  explicit context_segment events.
- Insulin sliding scale glucose checks during off-shift overnight
  hours of day 2 are abbreviated; could be filled in.
- Floor-stay days (day 4 and onward) would extend the chart toward
  a complete inpatient course.
- Discharge summary, discharge medication reconciliation note, and
  outpatient follow-up scheduling events for the current admission.
