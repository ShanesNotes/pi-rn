# Field spec 05 — bitemporal time + canonical UTC

Status: completed
Parent: `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`
Issue: `issues/05-bitemporal-time-fields-and-canonical-utc-contract.md`
Posture: `adopt`

## Field table

| Field (contract) | Canonical-memory role | Clinician label(s) | Current pi-chart | Kernel target | Posture |
| --- | --- | --- | --- | --- | --- |
| `time.valid` (instant) | Clinical/valid time | **Occurred**, **Effective**, **As of** | `effective_at`; `VitalSample.sampled_at` | `time.valid` instant | `adopt` |
| `time.valid` (interval) | Valid time span | **Effective**, **As of** | `effective_period.{start,end?}` XOR `effective_at` | `time.valid` interval (`end >= start`) | `adopt` |
| `time.recorded_at` | Transaction time | **Charted**, **Last charted** | `recorded_at` on all shapes | `time.recorded_at` | `adopt` |

## Instant XOR interval

`time.valid` is exactly one of instant or interval — never both, never neither. Open-ended intervals (`end` absent) mean still-effective.

## Four clinician labels (projections)

| Label | Derived from |
| --- | --- |
| Occurred | `time.valid` (instant or interval start) |
| Effective | `time.valid` |
| Charted / Last charted | `time.recorded_at` |
| As of | read `asOf` ∩ `time.valid` ∩ supersession via `eventCoversAsOf` |

"As of" is not stored — it is the read parameter intersected with valid time and supersession.

## Canonical UTC contract

Contract value: `YYYY-MM-DDTHH:MM:SSZ` (20 chars, trailing `Z`, valid calendar).

Rejected by kernel (not normalized): offsets, fractional seconds, zone names.

Normalization is the adapter's job (out of scope). Facts whose timestamps cannot re-emit as canonical UTC are not kernel-admissible.

## Store-owned, must-not-emit

| Field | Owner | Chart rule |
| --- | --- | --- |
| `accepted_at` | Append ledger / StoreClock | Never emit on write |
| `seq` | Append ledger | Never emit |
| `batch_id` | Append ledger | Never emit |
| Record/Entry hash, prev-link, head | Append ledger | Never emit as authored metadata |

Caller-set is fine: `id`, `recorded_at`.

Display-on-read of store-assigned metadata may be permitted; authoring it is forbidden.

## Scaling posture

Bitemporal split enables concurrent multi-agent authorship. Store-assigned patient-scoped total order (`seq`/`accepted_at`) is load-bearing at volume. Canonical UTC removes cross-provider timezone ambiguity.

North star: clinical-truth service (ADR-promoted).

## Open questions

- Zoned strings in export vs canonical-at-rest (shared with Issue 13)
- `accepted_at` display-on-read policy confirmation

## Out of scope

Source edits, adapter implementation, kernel widening.