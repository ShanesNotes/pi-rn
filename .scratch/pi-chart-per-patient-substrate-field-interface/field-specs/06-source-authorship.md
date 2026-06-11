# Field spec 06 — source, authorship & provenance vocabulary

Status: completed
Issue: `issues/06-source-authorship-and-provenance-vocabulary.md`
Posture: `revise`

## Three separable axes

| Axis | Field | Question |
| --- | --- | --- |
| Source (origin) | `source{kind, ref?}` | Where did this come from? |
| Actor (asserter) | `actor{kind, id, role?, run_id?}` | Who/what asserted it? |
| Authority (posture) | projection (Issue 11) | How must clinician treat it? |

**Source ≠ authority:** `ordered` ≠ `Required`.

## `actor` (renamed from `author`)

| `actor.kind` | Meaning |
| --- | --- |
| `clinician` | Human asserter |
| `agent` | Pi/AI run — **must** carry `run_id` |
| `device` | Device/import pipeline |
| `system` | Deterministic chart process |

Kernel: `actor` → kernel `actor` (presence only). `role`/`run_id` chart-internal, affect Record hash.

## Controlled `source.kind` vocabulary

| `source.kind` | Clinician label |
| --- | --- |
| `ordered` | Ordered |
| `protocol` | Protocol |
| `unit_policy` | Unit policy |
| `nursing_plan` | Nursing plan |
| `patient_family_request` | Patient/family request |
| `suggested_by_pi` | Suggested by Pi |
| `device_import` | Device/import |
| `chart_derived` | Chart-derived |
| `report_only` | Report only / From handoff |

`source` has **no kernel field**.

## Scaling

Many providers + many agent runs = distinct asserters via `(actor.id, actor.run_id)`.