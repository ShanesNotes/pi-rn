# PRD — A6/A7 Provider + Nursing notes audit (Pass A)

## Status

- Board card: `PRD-A67-audit`
- Predecessor: `PHA-001` (`docs/plans/prd-phase-a-completion-to-implementation-bridge.md`)
- Source authority:
  - `clinical-reference/phase-a/a6-provider-notes-council-synthesis.md`
  - `clinical-reference/phase-a/a7-nursing-notes-council-synthesis.md`
- HITL authorization: decision #5 in `memos/hitl-decisions-26042026.md` ("a6/a7 notes (combined)" — open `prd-phase-a-notes-translation.md` + test-spec for provider+nursing notes view/validator translation, mirror a3 TB-style boundary discipline).
- Paired test spec: `docs/plans/test-spec-a67-notes-audit.md`.
- Pass: **A (round-1, audit-only).** Pass B (V-NOTES-04..NN tracer bullets) is round-2 deferred and out of this card's scope.

## Why this lane exists

V-NOTES-01/02/03 already shipped in `src/validate.ts:1010-1450`. The shipped surface is:

- **V-NOTES-01 — bidirectional note↔communication substrate pairing.** Note-id without matching `communication.data.note_ref` and `communication.data.note_ref` without matching note id both raise as errors. Evidence: `src/validate.ts:1362,1376`.
- **V-NOTES-02 — nursing-scope concern warnings.** `rn_agent` and `nurse_practitioner` author roles emit role-aware soft warnings without blocking. Evidence: `src/validate.ts:1438`.
- **V-NOTES-03 — missing/malformed YAML frontmatter (note discoverability).** Missing frontmatter, malformed YAML, missing `id`, and missing/invalid `recorded_at` all warn (rather than hard-error) so substrate integrity rules can still pair by id where possible. Evidence: `src/validate.ts:1234-1267`.

PRD-A67 must **not** redefine V-NOTES-01/02/03. Its job is to audit the council requirements in a6/a7 against the shipped infrastructure to identify the **gaps** that round-2 V-NOTES-04+ rules will close. All round-2 rules are PROPOSED-only in this PRD; nothing here authorizes validator/view code edits.

## Field-name verification

Round-1 audit must cite the actual envelope field names in the shipped substrate so that round-2 rule drafts do not invent a parallel vocabulary.

| Concern | Authoritative field | Evidence |
|---|---|---|
| Author role on a `communication` event | `author.role` (envelope) | `src/validate.ts:1323-1326` (`function authorRoleOf(value): value?.author?.role`); `src/views/timeline.ts:61` (`author: ev.author`). **Not** `data.author_role`. |
| Note↔communication pair edge | `communication.data.note_ref` ⇄ note frontmatter `id` | `src/validate.ts:1156-1158` (`ev?.data?.note_ref`); `src/validate.ts:1356-1378` (V-NOTES-01 pairing). |
| Connector signature (current API) | `buildContextBundle(view, input)` | `scripts/agent-canvas-connector.ts:30-33`. The `(patientId, encounterId, asOf)` form documented in project memory is **future direction**, not the current API; round-2 audit must not confuse the two. |
| Demo fixture target | `patient_002 / enc_p002_001` | Real fixtures already exist under `patients/patient_002/timeline/2026-04-19/`. |
| Regression fixture target | `patient_001` | Pre-existing seed fixture; round-2 must not retrofit nursing_note shape onto it. |

## Subtype audit (gap matrix)

Council subtype lists:

- A6 line 104: `admission_note`, `progress_note`, `consult_note`, `procedure_note`, `event_note`, `attestation`.
- A7 line 114: `sbar`, `handoff`, `progress_note`, `admission_note`, `event_note`, `phone_note`, `focused_note`, `attestation`.

Cap: ≤ 14 rows. Shared subtypes (e.g. `progress_note`, `admission_note`, `event_note`, `attestation`) appear once with both author-role expectations recorded.

| # | Council subtype | Family | Shipped covered? | Evidence | Gap (round-2 V-NOTES-NN proposed) |
|---|---|---|---|---|---|
| 1 | `admission_note` | provider+nursing (shared) | partial — pair integrity only | `src/validate.ts:1356-1378` (V-NOTES-01 pairs body+envelope) | **V-NOTES-04 (proposed)** — admission-note problem/plan obligation: provider role must cite ≥1 `assessment.problem` and ≥1 plan/order; nursing role must cite ≥1 A8 head-to-toe finding/session in admission window. |
| 2 | `progress_note` | provider+nursing (shared) | partial — substrate pair only | `src/validate.ts:1356-1378` | **V-NOTES-05 (proposed)** — progress-note evidence-in-window: must cite or co-author in-window evidence (`vitals_window`, A4 MAR, A5 I&O, A8 finding) or a structural assessment/intent change. |
| 3 | `consult_note` | provider | not covered | — | **V-NOTES-06 (proposed)** — consult-note referral and action closure: `data.consult_request_ref` must point to `intent.referral`; an `action.notification` (or future `action.consult_delivered`) must `fulfills` the referral and `supports` the note. Communication carries no `fulfills`. |
| 4 | `procedure_note` | provider | not covered | — | **V-NOTES-07 (proposed)** — procedure-note action link: `data.procedure_ref` must point to an `action.procedure_performed`; verification artifacts/assessments cited where applicable. |
| 5 | `event_note` | provider+nursing (shared) | not covered | — | **V-NOTES-08 (proposed)** — event-note trigger + notification chain: must cite a triggering event/window; if narrative indicates provider notification, a paired `action.notification` must exist (cross-references V-NOTES-12). |
| 6 | `attestation` | provider+nursing (shared) | partial — pair integrity only | `src/validate.ts:1356-1378` | **V-NOTES-09 (proposed)** — attestation target + substance: `data.attests_to` must resolve to a primary note id; `data.attestation_basis` must be non-empty and not boilerplate-only. Teaching/preceptor closure is profile-gated. |
| 7 | `sbar` | nursing | not covered | — | **V-NOTES-10 (proposed)** — handoff evidence obligation (shared with `handoff`): must cite ≥1 active problem/context, ≥1 active care/monitoring plan or order context, and ≥1 recent observation window/event. |
| 8 | `handoff` | nursing | not covered | — | (covered by V-NOTES-10) |
| 9 | `phone_note` | nursing (shared with provider phone communications) | not covered | — | **V-NOTES-11 (proposed)** — phone-note material-communication shape: `data.recipient` and `data.channel` required; if note narrative indicates clinically material content, paired `action.notification` recommended (warn). |
| 10 | `focused_note` | nursing | not covered (subtype not yet registered in schema) | — | **V-NOTES-13 (proposed)** — focused-note payload obligations: non-empty `data.focus.concern_kind`; ≥1 trigger and ≥1 response observation OR intervention action ref. Subtype registration is a separate schema-level slot, not a validator rule. |
| 11 | (cross-cutting; row enumerated under §Cross-cutting) | — | — | — | — |
| 12 | (cross-cutting) | — | — | — | — |
| 13 | (cross-cutting) | — | — | — | — |
| 14 | (cross-cutting) | — | — | — | — |

Rows 11–14 are reserved for the cross-cutting requirement audit below; they are not additional council subtypes. Total council subtypes anchored: 10 distinct (after dedup of shared `admission_note`, `progress_note`, `event_note`, `attestation`).

## Cross-cutting requirement audit

Cap: ≤ 8 rows. Each row anchors one council load-bearing requirement that does not map cleanly to a single subtype.

| # | Requirement | Source | Shipped covered? | Evidence | Gap (round-2 V-NOTES-NN proposed) |
|---|---|---|---|---|---|
| 1 | Attestation pairing — `data.attests_to` resolves to a primary note; `data.attestation_basis` is substantive | a6 §15 V-NOTE-08; a7 §15 V-NNOTE-09; a6 line 504 | partial — pair only | `src/validate.ts:1356-1378` | V-NOTES-09 (proposed; row 6 above). |
| 2 | SBAR/handoff evidence obligations — active problem + active plan + recent observation in window | a7 §2(h) line 44; a7 §15 V-NNOTE-06 | not covered | — | V-NOTES-10 (proposed; row 7 above). |
| 3 | Focused-note shape — `data.focus.concern_kind`, trigger, response/intervention | a7 §2(c); a7 §15 V-NNOTE-05 | not covered (subtype unregistered) | — | V-NOTES-13 (proposed; row 10 above) + schema slot for `focused_note` subtype enum (deferred to round-2 schema lane). |
| 4 | Provider notification chain — narrative "MD notified" must match `action.notification` | a7 §2(g) line 46; a7 §15 V-NNOTE-08 | not covered | — | **V-NOTES-12 (proposed)** — provider-notification chain: if note narrative or `data.provider_notification_ref` indicates notification, a paired `action.notification` must exist with recipient, channel, reason, and response/callback status. |
| 5 | A7 §2(g) — RNs do not author medical diagnostic impressions | a7 §2(g) line 48 (paraphrase): "RNs … do not normally author medical diagnostic impressions or prescriptive orders unless credential/profile/protocol context supports it" | partial — V-NOTES-02 covers `rn_agent` and `nurse_practitioner` role friction at note authorship | `src/validate.ts:1438-1450` | **V-NOTES-14 (proposed)** — soft warn for `rn`/`lpn`/`student_nurse` authoring `assessment.impression` or `assessment.differential` outside profiled credential/protocol context. Severity: warn (council §16 Q3 lean: soft warn-not-block). |
| 6 | A7 §2(h) handoff evidence shape — flat `links.supports` minimum, optional `data.sbar_sections[]` | a7 line 44 + §16 Q4 | not covered | — | (covered by V-NOTES-10; `data.sbar_sections[]` remains open-schema, no rule). |
| 7 | A6 reasoning/plan coupling — narrative plan changes must decompose into companion `assessment.*`/`intent.*` events | a6 §16 Q6 line 528 | not covered | — | **V-NOTES-15 (proposed)** — narrative-vs-structured coherence: progress/admission notes whose narrative claims a plan/order/medication/device change without a companion structured event in the same window emit warn or open-loop `plan_order_divergence`. Severity: warn by default; HITL must approve any escalation. |
| 8 | A6 §16 Q7 session coupling — implicit author+window grouping vs explicit `data.session_id` | a6 §16 Q7 line 529 | not covered; council lean is **implicit grouping, no new session id yet** | — | **No round-2 rule.** Logged as open-schema question; defer until council/HITL approves a session primitive. Round-2 rule slot reserved as `V-NOTES-16 (deferred)` so the slot id stays unique. |

## nursing_note substrate-correction sub-task

Council authority (a7 line 34 §2(a)): "A7 reuses the A6 paired-note substrate. A nursing note is a Markdown note file plus a matching `communication` event carrying `data.note_ref`. **A7 does not add `type: nursing_note`, `type: note`, or a new storage primitive.**" Council authority (a7 line 36 §2(b)): "**Author role, not author-prefixed subtype, distinguishes nursing from provider notes.** A7 reuses shared `communication` subtypes." Council subtype list (a7 line 114) does **not** include `nursing_note`.

The repo currently asserts `subtype === "nursing_note"` in multiple places. These sites violate the council direction and must be surfaced for HITL disposition before any round-2 rule can depend on the subtype vocabulary.

### Site enumeration

| # | Site | Kind | Snippet anchor |
|---|---|---|---|
| 1 | `patients/patient_002/timeline/2026-04-19/events.ndjson:4` | fixture (event envelope) | `"type":"communication","subtype":"nursing_note"` on `evt_p002_0910_nursing_comm`. |
| 2 | `patients/patient_002/timeline/2026-04-19/notes/0910_nursing-note.md:4` | fixture (note frontmatter) | `subtype: nursing_note`. |
| 3 | `src/views/memoryProof.test.ts:63` | test assertion | `assert(notes.some((note) => note.subtype === "nursing_note"), "narrative note missing");` |
| 4 | `patients/patient_002/_derived/memory-proof.md:92` | derived/proof artifact | `evt_p002_0910_nursing_comm — nursing_note → care_team`. |
| 5 | `patients/patient_002/_derived/memory-proof.md:94` | derived/proof artifact | `detail: communication:nursing_note at 2026-04-19T09:10:00-05:00`. |

Count: 5 sites across 4 files (one fixture pair `events.ndjson` + `notes/`, one test, one derived artifact at two lines). Sites 4–5 are derivable; correcting sites 1–3 will regenerate the derived artifact in a future re-derive pass.

### HITL options to surface

- **Option (i) — migrate fixtures+tests to council subtypes.** Rewrite the patient_002 nursing-note pair to one of the council nursing-applicable subtypes — likely `progress_note` (shift narrative) or `focused_note` (concern-centered respiratory note, given the existing fixture mentions "focused respiratory note" in `data.summary`) — and update `src/views/memoryProof.test.ts:63` to assert against the chosen subtype with `author.role === "rn"`. Re-derive `_derived/memory-proof.md`.
- **Option (ii) — author exception ADR.** Write `decisions/0NN-nursing-note-subtype-exception.md` documenting why `nursing_note` is retained as a pi-chart-specific extension to the council subtype list, what guarantees it preserves, and how validators/views must treat it.

### Block on round-2

Any round-2 V-NOTES-04+ rule that depends on `subtype === 'nursing_note'` is **explicitly blocked** by this PRD until HITL chooses (i) or (ii). Round-2 rule drafts must instead key on shared council subtypes plus `author.role` (per a7 §2(b) "author role, not author-prefixed subtype").

## HITL ask block

After review, HITL approves:

- (a) the gap matrix above (subtype audit + cross-cutting requirement audit), including the proposed V-NOTES-04..15 round-2 rule slots;
- (b) round-2 V-NOTES-04+ rule slots as **proposed-only** entries (no validator/view edits authorized by this PRD);
- (c) the `nursing_note` migration vs exception decision (option (i) or option (ii) above), unblocking any round-2 rule that depends on a council subtype.

No code may land under PRD-A67 round-2 until the three approvals above are recorded.

## Boundary

This PRD is **docs-only** for round-1 (Pass A). No edits during round-1 authoring to:

- `src/`
- `schemas/`
- `patients/`
- `clinical-reference/`
- `scripts/`
- `tests/` (top-level, where applicable)

Pass B (round-2) is the only place where validator/view code or fixture changes may land, and only under a separate execution card with its own HITL gate per the gap matrix.

## Verification command

```bash
python3 - <<'PY'
from pathlib import Path
prd = Path('docs/plans/prd-a67-notes-audit.md').read_text()
spec = Path('docs/plans/test-spec-a67-notes-audit.md').read_text()

# Every council subtype must appear in the gap matrix.
council_subtypes = [
    # a6 line 104
    'admission_note', 'progress_note', 'consult_note', 'procedure_note',
    'event_note', 'attestation',
    # a7 line 114 (additions only; shared subtypes already listed)
    'sbar', 'handoff', 'phone_note', 'focused_note',
]
missing = [s for s in council_subtypes if prd.count(f'`{s}`') == 0]
if missing:
    print('Missing council subtypes from gap matrix:', missing)
    raise SystemExit(1)

# At least one round-2 V-NOTES-NN proposed slot must exist.
import re
proposed_slots = re.findall(r'V-NOTES-(\d{2})', prd)
proposed_round2 = [n for n in proposed_slots if int(n) >= 4]
if not proposed_round2:
    print('No round-2 V-NOTES-NN proposed slot found.')
    raise SystemExit(1)

# Field-name citation discipline: author.role must be cited with file:line.
if 'src/validate.ts:1323' not in prd or 'src/views/timeline.ts:61' not in prd:
    print('Field-name evidence missing: author.role citations required.')
    raise SystemExit(1)

# nursing_note site enumeration: count >= 1.
if 'src/views/memoryProof.test.ts:62' not in prd and 'src/views/memoryProof.test.ts:63' not in prd:
    print('nursing_note site enumeration missing memoryProof.test.ts citation.')
    raise SystemExit(1)

# PRD must reference the test-spec and vice versa.
if 'test-spec-a67-notes-audit.md' not in prd:
    print('PRD does not reference paired test-spec.')
    raise SystemExit(1)
if 'prd-a67-notes-audit.md' not in spec:
    print('Test-spec does not reference paired PRD.')
    raise SystemExit(1)

print('PRD-A67 audit verification: OK')
PY
```
