# Field spec 09 — lifecycle vocabulary + correction Record hash

Status: completed
Issue: `issues/09-lifecycle-vocabulary-and-correction-record-hash.md`
Posture: `revise`

## Resolution vs correction (headline split)

- **Resolved** — clinical situation closed; original fact stays true history (`links.resolves`)
- **Corrected/Replaced** — prior assertion wrong/refined; `revises` with Record hash

## Lifecycle table

| Substrate | Clinician label | Posture |
| --- | --- | --- |
| `draft` | (provisional only) | not kernel-emitted |
| `active` | Active | adopt |
| `superseded` | **Replaced** (never "Superseded" in UI) | revise |
| `entered_in_error` | Entered in error | adopt |
| **`resolved` (NEW)** | **Resolved** | revise — headline add |
| `final` | (no standalone label) | stop using for problem closure |

## `revises` + Record hash (hard requirement)

Correction facts need `revises.target.{id, hash}` where `hash` is `sha256:<64hex>` Record hash recomputing against stored target.

Today `links.corrects` has id only — **not Revision-admissible**.

## Draft + suggestion

`draft` and Pi-`Suggested` (Issue 12) are provisional — not sanctioned chart truth, not kernel-emitted.

## Scaling

Append-only + correction-by-new-fact = safe concurrent multi-agent authorship.