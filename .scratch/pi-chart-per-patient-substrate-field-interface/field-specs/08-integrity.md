# Field spec 08 — `integrity` + agreed canonicalization id

Status: completed
Issue: `issues/08-integrity-field-and-agreed-canonicalization-id.md`
Posture: `open-question` (agreement prerequisite, not implementation)

## `integrity` field (new)

```json
"integrity": { "canonicalization": "jcs-rfc8785-pi-chart-v1" }
```

| Subfield | Role |
| --- | --- |
| `canonicalization` | Names rule — **included** in hash |
| `hash` | Record hash — **excluded** from hash (self-field) |
| `signature` | Future signing — **excluded** from hash |

Top-level only; nested `integrity` in `object` is hash-sensitive.

## Canonicalization agreement (OPEN prerequisite)

Kernel authority: `pi-ledger/crates/ledger-core/src/canonical.rs`
- `CANONICALIZATION_ID = "jcs-rfc8785-pi-chart-v1"`
- TS prototype deleted per ADR 020

Chart and kernel must agree on `canonical_json`/`record_hash` before cross-side hashes match. **Not implemented here.**

## Kernel mapping

`integrity` → kernel `Claim.integrity` (presence-checked). Hash computed by store on admission.