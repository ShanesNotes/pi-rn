# integrity field + agreed canonicalization id

Status: ready-for-human
Type: SPEC (field-definition doc — not a source edit)
Reconciliation posture: open-question
PRD user stories covered: 17

## Parent

`.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md` (§2.E `integrity`; §4 mappability prerequisite #6 + #7; Implementation Decisions — canonicalization "agreement named as prerequisite, not implemented")

## Companion inputs

- `pi-ledger/crates/ledger-core/src/canonical.rs` — **the canonicalization authority** (`CANONICALIZATION_ID = "jcs-rfc8785-pi-chart-v1"`; `canonical_json`/`record_hash`; integrity self-field exclusion rule).
- `pi-ledger/docs/ledger-core-public-interface.md` — frozen Claim target (`integrity` presence-checked; the whole Claim must canonicalize).
- `pi-chart/src/types.ts` — current model has **no** top-level `integrity` field.
- ADR 020 — the pi-chart TS prototype `src/claim-ledger/canonical.ts` was **deleted**; the kernel is the single canonicalization authority.
- `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md` **(proposed, not accepted)** — canonicalization/hashing "runs once, in Rust — single source of truth."

## Scope at scale (architect mandate, 2026-05-29)

Append-only + tamper-evidence is the property that makes **concurrent authorship by many agents and providers safe at volume**: facts are never mutated, only appended, and each fact's content is content-addressable by a Record hash. `integrity` is the field that carries that property into the chart's field contract. For a single canonicalization rule to produce matching hashes across the Rust kernel and any client, there must be **one** canonicalization implementation, not two — which is exactly why ADR 020 deleted the TS prototype. This issue's posture is therefore **open-question**: the *agreement* is a prerequisite, not something implemented here.

## What to build

Define the top-level `integrity` field (which pi-chart does not have today) and specify the requirement — **as an open prerequisite, not an implementation** — that the chart's canonicalization rule must AGREE with the kernel's `canonical_json`/`record_hash` so cross-side hashes match.

### A. The `integrity` field (new top-level field)

| Contract field | JSON type | Required | Canonical-memory role | Current pi-chart rep |
| --- | --- | --- | --- | --- |
| `integrity` | object | yes | append-only tamper-evidence anchor for the fact | **none today** (new field) |
| `integrity.canonicalization` | String | yes | names the canonicalization rule used | none |
| `integrity.hash` | String (`sha256:<64hex>`, optional on author) | conditional | the Record hash; **store-assignable** (see kernel note) | none |
| `integrity.signature` | String (optional) | no | future signing slot | none |

The minimal authoring shape matches the kernel fixture (`canonical.rs`):

```json
"integrity": { "canonicalization": "jcs-rfc8785-pi-chart-v1" }
```

### B. The self-field exclusion rule (must be honored to agree)

The kernel computes the Record hash over the canonical JSON of the **whole Claim**, but **excludes `integrity.hash` and `integrity.signature`** from the hashed bytes when `context == RootIntegrity` (`canonical.rs` lines 60–87, test `record_hash_excludes_integrity_hash_and_signature_self_fields`). Therefore:

- `integrity.canonicalization` **is** part of the hashed content (changing it changes the hash).
- `integrity.hash` and `integrity.signature` are **self-fields** excluded from the hash (so a fact can carry its own hash without it being self-referential).
- Only the **top-level** `integrity` block is special-cased; a nested `integrity` inside `object` is hash-sensitive (test `nested_payload_integrity_fields_remain_hash_sensitive`). The contract must place tamper-evidence at top level only.

Any pi-chart-side canonicalization that does not reproduce this exclusion rule will produce hashes that **disagree** with the kernel — which is the failure this issue exists to flag.

### C. Canonicalization-id agreement (the open prerequisite)

The canonicalization id `jcs-rfc8785-pi-chart-v1` must denote **byte-identical** canonical output between the chart and the kernel. Agreement points the chart side must satisfy (all owned by `canonical.rs`, **not** re-implemented here):

| Rule | Kernel authority (`canonical.rs`) | Agreement requirement |
| --- | --- | --- |
| Object key ordering | UTF-16 code-unit sort (`compare_utf16`) | chart must sort keys identically (not byte/codepoint sort) |
| Number formatting | JCS number rules; iJSON safe-integer bounds ±9007199254740991 | chart must reject/format numbers identically; out-of-range integers rejected |
| Integrity self-field exclusion | excludes top-level `integrity.hash`/`signature` only | chart must exclude exactly these, only at root |
| Record hash algorithm | `sha256` over canonical bytes → `sha256:<64hex>` | chart must produce the same digest string |
| Unsupported input | NaN/Infinity/undefined/function rejected deterministically | chart must reject the same inputs |

**Posture: open-question / not implemented.** Per ADR 020, the TS prototype was deleted because two cryptographic implementations is the duplication the kernel exists to remove. So the *agreement mechanism* is undecided: either (a) the chart never canonicalizes locally and always asks the kernel/service for hashes, or (b) a single Rust canonicalization is shared to the client (e.g. a wasm build of just the canonicalization, per the **proposed** clinical-truth service §4) so there is still one implementation. This issue **names** the agreement as a prerequisite and does **not** pick the mechanism.

## Kernel-mapping note

- `integrity` → kernel **`integrity`**. The frozen kernel checks **presence**; the whole Claim must canonicalize. The contract field maps directly.
- `integrity.hash` is effectively **store-assignable**: the kernel's Append step assigns the Record hash, and the hash is computed by `record_hash` excluding the self-fields. The chart MAY carry an optimistic hash, but the kernel's recomputed hash is authoritative — so `integrity.hash` borders the K3 store-owned boundary (cf. Issue 05's `accepted_at`/`seq`/`batch_id` never-emit list). Correction targets (Issue 09) require the **kernel** Record hash (`sha256:<64hex>`) that recomputes against the stored target.
- **One implementation, not two:** mapping bends the chart to the frozen kernel canonicalization; the kernel is **not widened** and the chart does **not** clone canonicalization (ADR 020).
- **Scale dependency:** "canonicalization runs once, in Rust" as the single source of truth across many concurrent clients is the **proposed** clinical-truth service posture (`clinical-truth-service-decision-proposal.md`, *proposed — not accepted*). The `integrity` field shape does not depend on acceptance; the agreement *mechanism* does.

## Acceptance criteria

- [ ] Doc specifies the top-level `integrity` field (`canonicalization` required; `hash`/`signature` optional) with the minimal authoring shape matching `canonical.rs`.
- [ ] Doc states the self-field exclusion rule (top-level `integrity.hash`/`signature` excluded from the hash; nested integrity is hash-sensitive; `canonicalization` is hashed).
- [ ] Doc names `jcs-rfc8785-pi-chart-v1` and requires it to AGREE with the kernel `canonical_json`/`record_hash`, listing the concrete agreement points (key ordering, number rules, exclusion, sha256, unsupported-input rejection) and citing `canonical.rs` as the authority.
- [ ] Doc flags canonicalization-id agreement as an **open prerequisite, not implemented**, and records that ADR 020 forbids a second TS canonicalization implementation.
- [ ] Kernel-mapping note: `integrity` → kernel `integrity` (presence-checked); `integrity.hash` borders K3 store-owned; no kernel widening; no cloned canonicalization.
- [ ] At-scale single-canonicalization claim is marked as assuming the **proposed** clinical-truth service and cites the proposal.
- [ ] Connectors stay `(patientId, encounterId, asOf)`-parameterized; no hardcoded patient (demo `patient_002`/`enc_p002_001`; regression `patient_001`).

## Blocked by

- Issue 05 — bitemporal time + canonical-UTC contract (timestamps must be canonical for the Claim to canonicalize and hash deterministically).

## Open questions for the architect

1. **Agreement mechanism (the core open question).** Given ADR 020 forbids a second implementation, how does the chart obtain hashes that agree with `canonical.rs`? (a) always round-trip to the kernel/service for hashing; (b) share one Rust canonicalization to the client as a wasm fast-path (proposal §4); (c) other. **Not decided here.**
2. **Is the chart allowed to emit `integrity.hash` at all?** If `integrity.hash` is store-assigned like `accepted_at`/`seq`/`batch_id` (Issue 05), should the chart field contract mark it **never-emit** (kernel assigns) or **optimistic-only** (chart may carry, kernel overwrites)? (Borders K3; surfaced.)
3. **Canonicalization-id versioning at scale.** When the rule evolves past `...-v1` across many long-lived concurrent clients, how is the version negotiated so old and new clients still agree? (Versioned-contract concern from the proposal; surfaced, not decided.)
