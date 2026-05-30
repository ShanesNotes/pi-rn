# Human-agent suggestion state on the substrate

Status: ready-for-agent
Type: AFK / SPEC artifact (field-definition doc, not a source edit)
Reconciliation posture: adopt
PRD user stories covered: 24 (and supports 14, 22)

## Parent

`.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md` (§2.G "Human-agent boundary"; Implementation Decisions: "Pi outputs are `Suggested` provisional facts; promotion ... is a separate human action (Add to Shift Brain); suggestions are disable-able; no autonomous accepted-write or completion authority.").

## What to build

A field-definition doc defining the **Suggested provisional-fact state** on the charted-clinical-fact substrate, the **human-only promotion** action (Add to Shift Brain), suggestion **disable-ability**, and the hard **no-autonomous-write / no-autonomous-completion boundary**. This adopts the PRD posture; it does not re-decide any cross-cutting choice.

### Scaling posture (architect mandate 2026-05-29)

In a hugely data-rich, multi-provider, multi-agent setting **many distinct agents may concurrently emit Suggested facts** against the same patient/encounter. The model must make this safe: a Suggested fact is **append-only**, scoped to `(patientId, encounterId)`, and carries explicit **actor (asserter)** = the Pi agent run and **source (origin)** = `Suggested by Pi`, kept separable from **authority (posture)** = `Suggested`. **No agent — however many are running — may chart, accept, complete, verify, or sign.** Promotion is exclusively a human action. This keeps concurrent authorship safe: agents add provisional facts; humans alone cross the accepted-write boundary.

## The suggestion state as a fact-level field

A Pi suggestion is itself a **charted-clinical-fact instance** (append-only), not a side-channel object. It carries the standard identity/scope/time/source/actor fields and a provisional posture. It is distinguished by:

- **authority posture = `Suggested`** (the explicit authority value from Issue 11 group 1).
- **source = `Suggested by Pi`** (controlled `source.kind`, Issue 06) — origin, not authority.
- **actor / agent-run lineage = `author.run_id`** (the consumed run-id field, Issue 06) so "Suggested by Pi" provenance is derivable to the specific run, even with many concurrent runs.

### Suggestion lifecycle states

| State | Meaning | Who sets it | How recorded |
| --- | --- | --- | --- |
| Suggested | Pi-authored provisional fact; advisory only | Pi agent (any run) | The suggestion fact itself (authority=`Suggested`) |
| Added (promoted) | Clinician turned it into a clinician-owned care item | Human only | **Separate** clinician-authored fact linking the suggestion (`links.supports`/`addresses`) |
| Modified | Clinician altered then owned it | Human only | Separate clinician-authored fact |
| Dismissed | Clinician declined it | Human only | Separate clinician-authored fact (provenance preserved) |
| Disabled (suppressed) | Suggestion class turned off | Human / config | View-level suppression; suggestion facts not surfaced |

A Suggested fact's posture is **never mutated** by promotion/dismissal. Promotion, modification, and dismissal are **separate append-only facts** (their own `id`, `actor`, `time`) that reference the suggestion — identical discipline to review/attestation facts (Issue 10). This is what makes concurrent multi-agent suggestion safe: the original is immutable evidence; the human action is a new fact.

## Human-only promotion: Add to Shift Brain

- Promotion is **Add to Shift Brain** — a clinician action that creates a **clinician-owned care item** fact from a Pi suggestion.
- The clinician-owned care item carries **clinician actor** and an authority posture other than `Suggested` (e.g. Routine/Required per Issue 11), linking the originating suggestion as evidence.
- "Add to Shift Brain" is **not charting truth** and is **not** the `Charted` state; it creates a view-owned care item. `Charted` still requires a sanctioned chart source (Issue 10, Done vs Charted).
- Modify and Dismiss are the other clinician-owned actions. All three preserve the suggestion's provenance in the Source trail.

## Disable-ability

- Suggestion classes (or all Pi suggestions) are **disable-able** by the clinician/config. When disabled, suggestion facts are suppressed from surfaces; the substrate is unchanged (append-only).
- Disable is a **view/access concern**, not deletion of substrate facts. At scale this is the volume-control valve so a flood of agent suggestions cannot drown clinician-owned work.

## The no-autonomous-write / no-autonomous-completion boundary (negative cases)

- **No autonomous accepted-write.** No agent may produce an *accepted* charted-clinical-fact. Agent output is confined to `Suggested` provisional facts. (Consistent with the kernel boundary: `pi-ledger` does not grant `pi-agent` direct accepted clinical write authority — ledger-core public interface, Boundary reminders.)
- **No autonomous completion.** No agent may mark a care item Done/Charted, mark a fact Reviewed/Verified/Signed/Co-signed, or finalize a handoff. Those are human-only facts (Issue 10/14).
- **No silent canonical memory.** A suggestion never becomes chart truth by visibility, age, or volume — only a human action promotes, and even promotion is a care item, not a chart source.
- **Many agents, same boundary.** The boundary holds identically regardless of how many concurrent agents suggest; concurrency does not create authority.

## Kernel-mapping note

The suggestion state is **chart-internal — no direct kernel field**. A Suggested fact, if it were ever projected to the kernel, would still be an ordinary Claim with its own `id`, `actor` (agent run), `source` (chart provenance — not a kernel field), `predicateId`/`factShape`, typed `object`, canonical-UTC `time`, and `integrity`. But the **accepted-write boundary is enforced upstream of the kernel**: under the **PROPOSED shared clinical-truth service** (gRPC/UDS, contract-first — `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`, *proposed, pending architect acceptance*), agent suggestions are **not** sent through the append path; only human-promoted, sanctioned writes reach admission. The kernel is **not widened** to model "suggested" — provisionality is a chart/runtime concern. Promotion/dismissal/modification facts map as ordinary Claims (act/context). The kernel's own boundary (`pi-agent` has no direct accepted-write authority) is the backstop.

## Connector contract

Any connector reading suggestion state stays `(patientId, encounterId, asOf)`-parameterized and **never hardcodes a patient**. Demo target `patient_002`/`enc_p002_001`; regression target `patient_001`.

## Acceptance checks

- [ ] Defines `Suggested` as a **fact-level** provisional state (append-only), with authority=`Suggested`, source=`Suggested by Pi`, actor=agent `run_id`.
- [ ] States promotion (**Add to Shift Brain**) is a **separate human action** producing a clinician-owned care item, never a mutation of the suggestion.
- [ ] States Add to Shift Brain is **not** charting truth / not `Charted`.
- [ ] States suggestions are **disable-able** (view-level suppression; substrate unchanged).
- [ ] Includes negative cases: **no autonomous accepted-write** and **no autonomous task completion** (and no autonomous Reviewed/Verified/Signed/handoff).
- [ ] States the boundary holds for **many concurrent agents** — concurrency does not confer authority.
- [ ] Carries a kernel-mapping note: chart-internal; accepted-write boundary enforced upstream of the kernel; kernel not widened; cites the **proposed** clinical-truth service.
- [ ] Connector signature `(patientId, encounterId, asOf)`, no hardcoded patient.
- [ ] Reconciliation posture (adopt) and `Status: ready-for-agent` present.

## Open questions (surface, do not answer)

- None blocking adoption. Whether modification/dismissal facts need their own registered predicates is an Issue 03/04 registry question, not re-decided here.

## Blocked by

- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/06-source-authorship-and-provenance-vocabulary.md` (source=`Suggested by Pi`; consumed `run_id`)
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/10-certainty-reconnection-and-review-as-separate-facts.md` (separate-fact discipline; Done vs Charted)
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/11-projection-facing-fields-authority-attention-timing-access-tier.md` (the explicit `Suggested` authority posture)
