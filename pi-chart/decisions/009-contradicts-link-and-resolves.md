# ADR 009 — Sixth link: `contradicts`, plus `addresses` → `resolves` narrowing

- **Status:** accepted (2026-04-22)
- **Date:** 2026-04-22 (drafted and accepted in one pass; implementation authorized under a forthcoming ADR 009 implementation contract)
- **Deciders:** Shane (operator)
- **Touches:** DESIGN §1 (envelope / link table), §4 (view primitives — `currentState`, `evidenceChain`, `openLoops`, `timeline`, `narrative`), §8 (invariants), schemas/event.schema.json, CLAIM-TYPES, validator, views
- **Source convergence:** v0.3 foundational-augmentation memo §2 (link count change 5 → 6); A0b constraint-graph conflicts (allergies, code-status disagreements); A1 pain-score tension and hemodynamic-stable vs BP 72/40; A0c longitudinal-problem-thread patterns; autoresearch P3 (peer-claim disagreement without retraction)
- **Depends on:** ADR 010 (typed `EvidenceRef` + role vocabulary — `contradicts` is distinct from `role: counterevidence` and the distinction must be explicit). Uses: ADR 002 (status lifecycle — resolution pattern interacts with supersession), ADR 003 (fulfillment — `resolves` loop-closing is adjacent to the intent→action contract), ADR 007 (implementation contract precedent).

## Revisions

_None. Drafted after the v0.3 memo pass and accepted in one go. The decision surface is larger than ADR 010 (one new link primitive, one renamed/narrowed link, four validator rules on the new link, one validator rule on the renamed link, one new openLoop kind, three view-layer additions), but each piece is specified end-to-end in the memo and the review burden is dominated by consistency checks, not open design questions._

## Context

Five links in v0.2 (`supports`, `supersedes`, `corrects`, `fulfills`, `addresses`) cover every link semantics **except structural disagreement between two peer claims that neither author retracts**. Three clinical patterns expose the gap:

- **Pain-score tension.** RN-A documents pain 3/10 at 14:00. RN-B documents pain 8/10 at 14:15 with no intervening analgesia. Neither is wrong; neither retracts. Today this is either silently contradictory (both "active" in `currentState`, first returned by sort key) or one author is pressured to `corrects` the other (falsely asserting a winner).
- **Constraint conflicts.** Patient states "no allergies"; pharmacy record carries a documented PCN reaction. Both are honestly authored evidence. A `corrects` link would erase one; neither author has the authority to.
- **Assessment vs vitals.** "Hemodynamically stable" assessment at 14:00; BP 72/40 at 14:10 with no intervening event. Assessment is not retracted (the context may have shifted); the observation is not wrong. The tension is structural, not editorial.

The v0.2 workarounds each break an invariant:

- **`corrects`** asserts a winner. DESIGN §1 invariant 5 (author accountability) is violated when one author implicitly overwrites another.
- **`supersedes`** without a resolving author is chronologically mechanical, not epistemically honest — the later writer has more information only _if_ the signal changed, not because they disagreed with the earlier writer about the _same_ moment.
- **Implicit silence** (both active, no link) makes the contested state invisible to every view. `currentState` silently picks one; `narrative` renders whichever sorted first; `openLoops` does not surface the need for clinical attention.

A sixth link, `contradicts`, records the structural tension as first-class data. Both claims remain; one is not privileged over the other at write time; a resolution is deferred to a future event that can `supersede` one side and carry a `resolves` link back to the original contradiction. `_derived/` renders the contested state prominently; `openLoops` surfaces long-unresolved contradictions as clinical tasks.

A second pressure converges on the same edit. The v0.2 `addresses` link carries two semantics simultaneously:

- **Problem-targeting** — `intent → assessment(problem)`, `communication → assessment(problem)`. "This order addresses the sepsis problem." Stable usage.
- **Loop-closing** — `communication → open-intent`, `action → active-alert`, `assessment → unacknowledged-note`. "This event closes an open loop raised earlier." Overloaded usage.

The two relations are different enough that validator cannot enforce a useful rule on either when both share one link name. The resolution pattern for `contradicts` (§Resolution below) also needs a loop-closing link; introducing one is cheapest right now, before a third consumer of the overloaded `addresses` arrives.

This ADR settles both: adds `contradicts`, narrows `addresses` to problem-targeting only, introduces `resolves` for loop-closing. Implementation is deferred to a follow-on contract per ADR 007 precedent.

## Decision

**Add `links.contradicts: Array<{ref, basis}>` as the sixth link type. Narrow `links.addresses` to problem-targeting only. Introduce `links.resolves: string[]` for loop-closing (including contradiction resolution). Surface contested state through `currentState`, `evidenceChain`, `openLoops`, `timeline`, and `narrative` so the contradiction is visible wherever the substrate is read.**

### Shape

```jsonc
"links": {
  "supports":    [EvidenceRef, ...],
  "supersedes":  [ "<event id>", ... ],
  "corrects":    [ "<event id>", ... ],
  "fulfills":    [ "<event id>", ... ],
  "addresses":   [ "<problem-assessment id>", ... ],   // narrowed in this ADR
  "resolves":    [ "<event id>", ... ],                // new
  "contradicts": [                                     // new
    { "ref": "<event id>", "basis": "<rationale, ≤500 chars>" },
    ...
  ]
}
```

TypeScript:

```ts
export interface ContradictsLink {
  ref:   string;     // event id, same-patient only
  basis: string;     // short operator-authored rationale, required
}

export interface Links {
  supports?:    Array<string | EvidenceRef>;
  supersedes?:  string[];
  corrects?:    string[];
  fulfills?:    string[];
  addresses?:   string[];           // problem-assessment targets only
  resolves?:    string[];           // loop-closing + contradiction resolution
  contradicts?: ContradictsLink[];  // sixth link
}

export type OpenLoopKind =
  | "pending_intent"
  | "overdue_intent"
  | "unacknowledged_communication"
  | "contested_claim";              // new
```

### Direction convention

The **later-written event (higher `recorded_at`) MUST carry the `contradicts` link pointing at the earlier event.** Validator derives the symmetric `contradicted_by` index for view consumption at read time; it is not stored. Rationale: append-only (invariant 2) forbids retroactive mutation; the earlier event cannot gain a link by decree of the later author. Any symmetric treatment is a read-time decoration, not a write-time artifact.

### `basis` requirement

`basis` is required on every `contradicts` entry and is capped at 500 characters. Rationale: a contradiction without author-stated rationale is an assertion without epistemic grounding. The clinical surface needs enough text to disambiguate "I read this as contradicting because the patient's hemodynamics had not changed" from "I had different observations at the same moment." Longer rationales belong in a linked communication event, not in the link payload.

### Resolution pattern

Contradictions close by emitting a resolving event that:

1. `supersedes` one of the two contradicting events (or authors a third event superseding both),
2. carries `resolves: [<contradiction-event-id>]` pointing at the later event in the contradiction pair (the one that carries the `contradicts` link), and
3. includes a non-empty `statusReason` or `basis` explaining the resolution.

The original `contradicts` link is **never deleted or rewritten**. It remains in the chain as permanent audit surface. The resolver records _how_ the tension was closed; the tension itself is historical.

Symmetrically: when `resolves` is used for loop-closing (a communication closing an open intent, an action closing an active alert), the resolving event targets the open-loop-kind event directly and carries a rationale in `statusReason`.

### `addresses` narrowing

`links.addresses` post-ADR-009 permits only targets that are `type: assessment` with `subtype: problem`. Targets that were previously loop-closing (pending intents, active alerts, unacknowledged communications) MUST be expressed as `links.resolves` instead. The rename is mechanical where v0.2 target typing already disambiguates the semantics; where a seed event carries `addresses` at an open-loop-kind target, the migration rewrites it to `resolves`.

Option A (narrow `addresses`, introduce `resolves`) is preferred over Option B (rename `addresses` → `targets`, introduce `resolves`). Option A keeps problem-targeting continuity in the seed corpus and in existing fixture drafts; Option B adds churn without clarification benefit.

### Schema rule

`schemas/event.schema.json` adds two properties under `links`:

```jsonc
"resolves": {
  "type": "array",
  "items": { "type": "string" },
  "description": "Open-loop-closing targets. A communication closing a pending intent, an action closing an active alert, an assessment closing a prior contradiction. Validator enforces target typing per V-RESOLVES-01."
},
"contradicts": {
  "type": "array",
  "items": {
    "type": "object",
    "required": ["ref", "basis"],
    "properties": {
      "ref":   { "type": "string", "minLength": 1 },
      "basis": { "type": "string", "maxLength": 500, "minLength": 1 }
    },
    "additionalProperties": false
  },
  "description": "Structural tension with a prior peer claim. The later-written event carries the link. Both sides remain active until a resolver event supersedes one and carries links.resolves pointing at this event. Validator enforces direction and same-patient scope per V-CONTRA-01..04."
}
```

`addresses` keeps its schema shape (string array) but its `description` is rewritten to point at the narrowed semantics (problem-subtype assessments only); per-target typing moves fully into validator authority via the existing rule surface.

### Validator changes

All new rules follow the `V-<AREA>-<NN>` convention.

- **V-CONTRA-01.** `contradicts[*].ref` MUST resolve to an event in the same patient directory. Severity: **err**. Error message: `V-CONTRA-01: contradicts.ref out-of-patient or nonexistent: {ref}`.
- **V-CONTRA-02.** An event MUST NOT simultaneously `contradict` and `correct` the same target. Correction is a resolved contradiction; the two carry different epistemic commitments and combining them on one event is a modeling error. Severity: **err**. Error: `V-CONTRA-02: contradicts and corrects target same event: {ref}`.
- **V-CONTRA-03.** `contradicts[*].ref` MUST point at an event with `recorded_at < source.recorded_at` (direction convention). Severity: **err**. Error: `V-CONTRA-03: contradicts.ref newer than source event`.
- **V-CONTRA-04.** If event A carries `contradicts: [B]`, an event C that `supersedes B` SHOULD either itself carry `contradicts: [A]` or carry `resolves: [A]`. Severity: **warn** in v0.3 and v0.4; promotes to **err** only if a demonstrated legacy-data pattern (retrospective resolution without reference) stays under a threshold in Phase A Batch 2+ fixtures. Rationale for warn-first: common real-world pattern is a supersession that implicitly resolves without an explicit `resolves` link, and forcing an error during migration would block legitimate legacy data.
- **V-RESOLVES-01.** `links.resolves[*]` MUST target an event whose state at resolution time is one of: (a) an open-loop-kind event (pending or overdue intent; active alert; unacknowledged communication), or (b) an event carrying a `contradicts` link. Severity: **err**. Error: `V-RESOLVES-01: resolves target is neither an open loop nor a contradiction-bearing event: {ref}`.

V-CONTRA-02 pairs with the existing invariant-10 enforcement around `corrects`; V-CONTRA-03 pairs with V-TIME-01/02 (ADR 004). Error messages name the rule code and cross-reference the invariant.

The existing `addresses`-target-typing check in `validate.ts` is tightened in-place: post-ADR-009, `addresses` targets MUST be `type: assessment` AND `subtype: problem`. Other target types become V-RESOLVES-01 candidates (the implementation migrates them, then the tightened `addresses` rule rejects any remaining cases).

### View updates (documented, implemented in follow-up ADR)

- **`currentState`** — every axis panel (problems, constraints, intents, observations) returns both `active` and `contested`. Two non-superseded events linked by a `contradicts` edge populate `contested` on the affected axis with the ordered pair plus `basis`. A silent winner is **never** picked. When either side is superseded, the axis stops being actively contested (resolution requires the `resolves` link; removal from `contested` requires supersession).
- **`evidenceChain`** — traversal forks at `contradicts` edges. Both branches are traversable. The depth cap (8, matching ADR 010 V-EVIDENCE-03) applies to each branch independently. Cycle detection uses a visited set that spans branches; `contradicts` cannot loop by construction (direction convention) but `derived_from` inside a cited `EvidenceRef` (ADR 010) might.
- **`openLoops`** — new kind `contested_claim` with fields `{kind: "contested_claim", events: [older, newer], basis, age_seconds, threshold_seconds, severity?}`. Unresolved contradictions older than `threshold_seconds` (default 3600s wall / one sim-tick-hour) surface as clinical tasks. `threshold_seconds` and `severity` MAY be set per-profile (ADR 008); default `severity: medium`. Contested claims with `severity: high` surface above overdue intents in the default ordering.
- **`timeline`** — contradictions render as paired entries with symmetric linking affordance. The render of the later event carries a pointer to the earlier; the render of the earlier carries a back-pointer derived at read time.
- **`narrative`** — contested claims annotated at render time in `_derived/current.md` with a "contested with" phrase. Profile-driven narrative phrasing is deferred to ADR 008.

### Why not collapse into `role: counterevidence` (ADR 010)?

The two serve different grains:

- `supports[*].role: counterevidence` (ADR 010) — **one author, one claim, disconfirming data acknowledged.** "I see this lactate trending down; I am still asserting worsening sepsis because of the mottled skin and the pressor requirement." Epistemic honesty inside a single reasoned assertion.
- `contradicts` link (this ADR) — **two authors, two peer claims, no retraction.** "RN at 14:00 documented pain 3/10; RN at 14:15 documents 8/10 with no intervening analgesia." Structural tension between claims, resolution deferred.

A nurse can `supports` with `role: counterevidence` when writing their own assessment. A nurse cannot `supports: counterevidence` someone else's already-written assessment — that would be mutation, which append-only (invariant 2) forbids. The second case is exactly where `contradicts` lives.

A single event MAY carry both if the author intends to both acknowledge disconfirming data and mark a live disagreement. In practice, one or the other applies per claim. Profiles (ADR 008) MAY forbid `contradicts` against same-author, same-problem prior assessments — use `supersedes` or `corrects` instead.

## Tradeoffs

| Axis                                    | (a) Sixth link `contradicts` + `addresses`→`resolves` narrowing (chosen) | (b) Overload `corrects` with a `disputed: true` flag | (c) Use only `counterevidence` role (ADR 010) and no new link |
|-----------------------------------------|---------------------------------------------------------------------------|------------------------------------------------------|---------------------------------------------------------------|
| Primitive discipline (charter §3.3)     | one new link; one narrowed link; justified by three use-case patterns     | no new primitive, but `corrects` semantics drift     | no new primitive, but loses peer-claim grain                  |
| Validator determinism                   | rules gate direction + cross-use (V-CONTRA-01..04)                        | `corrects + disputed` is an awkward surface for rules | `counterevidence` on someone-else's event is a mutation       |
| `currentState` contested rendering      | first-class; axis panels carry `contested` cleanly                        | requires filtering on `disputed` flag; lossy         | cannot render contested without an explicit structural link    |
| `openLoops` contested task surface      | new `contested_claim` kind, profile-tunable threshold                     | would need synthesis from `corrects` + flag + ages   | cannot surface contested as a loop without a link             |
| Seed migration                          | rewrite `addresses` → `resolves` where target is open-loop-kind; bare    | no migration                                         | no migration                                                  |
| Back-compat for v0.2 events             | `addresses` narrowing migrates mechanically; no existing event carries    | full back-compat                                     | full back-compat                                              |
|                                         | `contradicts` today                                                       |                                                      |                                                               |
| Interaction with ADR 010                | clean (separate grain; both usable in one event)                          | muddled — `corrects` is author-winner, counterevidence is author-honest  | `counterevidence` forced to carry peer-claim semantics it cannot |
| Narrative phrasing                      | "contested with X because Y" is renderable from link payload              | "corrected with note 'disputed'" is not a sentence   | no structural hook for contested phrasing                     |

(a) is the minimum primitive addition that carries three distinct clinical patterns without distorting `corrects` or overloading `counterevidence`. (b) preserves the five-link count at the cost of making `corrects` mean two things. (c) leaves the peer-claim tension invisible to every view.

## Consequences

- **DESIGN.md §1** — link table goes from 5 to 6 rows; `addresses` description narrows to problem-targeting; new row for `resolves`; new row for `contradicts` with schema summary and direction convention.
- **DESIGN.md §4** — view primitive specs get short notes on `contested` (in `currentState`), the `evidenceChain` fork, the `contested_claim` openLoop kind, and timeline/narrative contested rendering.
- **DESIGN.md §8** — add invariants: `contradicts` direction (later carries link); contested-view visibility; at least one of `{contradicts, resolves}` not permitted simultaneously with `corrects` targeting the same event.
- **schemas/event.schema.json** — add `links.resolves` and `links.contradicts` properties as specified; tighten `links.addresses` description (target-typing stays in validator).
- **CLAIM-TYPES.md** — link table updated with the two new link rows and the `addresses` narrowing; per-subtype allow-list for `contradicts` documented (any reasoning event may emit `contradicts`; observations typically do not — record as `counterevidence` on an assessment instead).
- **src/types.ts** — `Links.contradicts: ContradictsLink[]`, `Links.resolves: string[]`; new exported `ContradictsLink` and `OpenLoopKind = "contested_claim"` variant.
- **src/validate.ts** — V-CONTRA-01/02/03/04 and V-RESOLVES-01; existing `addresses`-target-typing check tightened; V-CONTRA-02 cross-references V-CORRECT invariant.
- **src/views/openLoops.ts** — new `contested_claim` emission; default threshold 3600s wall / one sim-tick-hour; profile-tunable once ADR 008 lands.
- **src/views/currentState.ts** — axis panels gain `contested` array; supersession logic handles the "one side superseded → contest silenced" case.
- **src/views/evidenceChain.ts** — traversal forks at `contradicts` edges; depth budget per branch.
- **src/views/timeline.ts** — paired entry rendering; symmetric-link decoration computed at read time.
- **src/views/narrative.ts** — contested annotation in `_derived/current.md`; profile-driven phrasing deferred.
- **scripts/migrate-v02-to-v03.ts** — rewrite `links.addresses[*]` → `links.resolves[*]` where the target is an open-loop-kind event (pending intent, overdue intent, active alert, unacknowledged communication). Leave as `addresses` where the target is a `problem`-subtype assessment. Idempotent; re-running is a no-op.
- **Seed `patient_001`** — audit: the respiratory case does not currently carry contradictions; no new `contradicts` events are authored for the seed. The `addresses` → `resolves` migration runs mechanically if any loop-closing usage exists in the current seed; fixture additions demonstrating contradictions live in `patient_fixture_v03/` or dated timeline subdirs of `patient_001` per the memo §11 fixture plan.
- **Repo-owned tests/examples** — `src/views/openLoops.test.ts`, `src/views/currentState.test.ts`, `src/views/evidenceChain.test.ts`, `src/validate.test.ts` gain cases exercising each rule, the contested rendering, the fork traversal, and the resolution pattern.
- **ROADMAP.md** — mark ADR 009 accepted; implementation pending under follow-on contract.

## Not decided here

- **Whether `basis` on `contradicts` supports markdown.** Current decision: plain string, ≤500 chars. Revisit if narrative phrasing benefits materially.
- **Whether the `contested_claim` default `threshold_seconds` is 3600s or something shorter for high-acuity profiles.** Default stands; profiles (ADR 008) drive per-subtype override.
- **Whether `contradicts` can target a superseded event.** Current lean: no — the structural tension is between active claims. Superseded events are resolved by supersession, not contradiction. V-CONTRA-04 warn captures the adjacent edge case (A contradicts B, C supersedes B without referencing A).
- **Whether `resolves` can target multiple contradictions in one event.** Current schema: string array, so yes. Rule stands; no validator lower bound on how many contradictions one event may close.
- **Whether V-CONTRA-04 promotes to err in v0.4.** Decision deferred until Phase A Batch 2+ fixtures show whether the retrospective-supersession-without-resolves pattern is rare enough to safely reject.
- **Whether `contradicts` accepts cross-encounter targets within the same patient.** Current decision: yes (V-CONTRA-01 is same-patient, not same-encounter). A cross-encounter contradiction is legitimate (e.g., an allergy statement recorded in a prior admit contradicted by one in the current admit).
- **Whether a profile MAY forbid `contradicts` entirely for a subtype.** Deferred to ADR 008. Lean: yes (some subtypes — e.g., signed attestations — should never carry a contradiction without an explicit amendment path).
- **Interaction with `corrects` chains.** If A corrects B, and C contradicts A, is C also implicitly contradicting B? Current decision: no — C contradicts A only. Transitive contradiction is a view-layer concern, not a link-layer one; `evidenceChain` may compute it at read time if a future view needs it.
