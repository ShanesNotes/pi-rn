# Deep Interview Spec — a6/a7 notes translation HITL

## Metadata

- Created: 20260426T190225Z
- Profile: standard
- Rounds: 5
- Final ambiguity: 5.4%
- Threshold: 20.0%
- Context type: brownfield
- Context snapshot: `.omx/context/a6-a7-notes-translation-hitl-20260426T185515Z.md`
- Source plan: `/home/ark/.claude/plans/ralplan-a6-a7-notes-translation.md`
- Transcript: `.omx/interviews/a6-a7-notes-translation-hitl-20260426T190225Z.md`

## Prompt-safe context summary

Final ralplan selected a single combined view-only lane for a6/a7 notes. The current lane characterizes the audit/discoverability invariant: every Markdown note has a queryable communication trace and every note-bearing communication resolves to a body. Current implementation ownership remains limited to `src/views/notes.ts`, `src/views/notes.test.ts`, and `src/views/index.ts` re-export. TB-V validator decisions were deliberately deferred and are resolved by this interview.

## Brownfield evidence vs inference

### Evidence

- `src/views/notes.ts` and `src/views/notes.test.ts` do not exist yet.
- `src/views/index.ts` is the view barrel export surface.
- `src/views/narrative.ts` pairs notes to `communication.data.note_ref` using Map insertion over loaded events.
- The final plan deliberately diverges in `notes.ts`: sort communication events by `recorded_at` ASC before building the note-ref index.

### Inference

- The TB-V follow-up will likely touch validator surfaces, but this interview does not authorize edits inside deep-interview mode.
- NP nursing-scope classification needs subtype/context support or a conservative warning posture to avoid collapsing a6 provider notes into a7 nursing semantics.

## Clarity breakdown

| Dimension | Score | Notes |
|---|---:|---|
| Intent | 0.95 | User wants remaining HITL decisions made explicit before TB-V. |
| Outcome | 0.97 | Validator-ready policy matrix is now defined. |
| Scope | 0.94 | Current lane remains view-only; TB-V follow-up owns validator policy. |
| Constraints | 0.95 | TB-style boundaries, no rn_agent, no schema/subtype expansion in current lane. |
| Success | 0.92 | Acceptance is a spec that downstream ralplan/autopilot can consume. |
| Context | 0.92 | Repo facts confirmed: notes files absent; narrative pairing divergence known. |

## Intent

Resolve the remaining HITL decisions so a future TB-V validator slice can implement notes rules without smuggling unresolved clinical-role, severity, duplicate-reference, or malformed-frontmatter assumptions into code.

## Desired outcome

A downstream planning/execution lane has a binding policy matrix for notes validators:

| Rule / issue | Policy |
|---|---|
| V-NOTES-01 substrate integrity | Hard error |
| V-NOTES-02 nursing scope | Warning, not blocking |
| `rn` | Nursing scope |
| `lpn` | Nursing scope |
| `student_nurse` | Nursing scope |
| `nurse_practitioner` | Nursing scope only when subtype/context indicates nursing work |
| `rn_agent` | Excluded; pi-agent system role, not clinical author role |
| Duplicate `data.note_ref` | Accepted silently; projection keeps earliest-`recorded_at` first-wins |
| Malformed/missing note frontmatter | Validator warning; view may continue silent skip behavior |

## In scope

- Preserve final OPTION A view-only ADR for the current a6/a7 notes lane.
- Record HITL decisions for the follow-up TB-V validator slice.
- Keep role-membership and rule-shape decisions explicit enough for tests.

## Out of scope / Non-goals

- No direct implementation inside deep-interview mode.
- No edits to `src/validate.ts`, schemas, `patients/`, or `src/views/narrative.ts` as part of this interview.
- No new note subtypes in this decision artifact.
- No SBAR addressability, action.notification chain, fulfillment enforcement, or attestation-chain expansion.
- No `rn_agent` clinical-role inclusion.

## Decision boundaries

OMX may carry these decisions into `$ralplan`, `$autopilot`, `$ralph`, or `$team` without re-asking:

1. Treat V-NOTES-01 substrate integrity as a hard error.
2. Treat V-NOTES-02 nursing scope as warn-not-block.
3. Include `rn`, `lpn`, and `student_nurse` in nursing author-role scope.
4. Treat `nurse_practitioner` as conditional: subtype/context decides nursing vs provider semantics.
5. Exclude `rn_agent` from clinical nursing scope.
6. Keep duplicate `note_ref` accepted silently, aligned with earliest-`recorded_at` first-wins projection behavior.
7. Warn on malformed/missing required note frontmatter in TB-V while preserving view silent-skip behavior.

OMX must ask again before:

- Adding new schemas/event subtypes.
- Making V-NOTES-02 a hard error.
- Reclassifying `nurse_practitioner` as role-alone nursing.
- Treating duplicate `note_ref` as warning/error.
- Treating malformed frontmatter as hard error.

## Constraints

- TB-style boundaries from the source plan remain binding for the view-only implementation lane.
- No new dependencies.
- Do not couple `pi-agent` directly to `pi-sim` source code.
- Use temp fixtures for tests rather than mutating `patients/`.
- Preserve deliberate `notes.ts` divergence from `narrative.ts` until a TB-V helper-extraction lane reconciles shared pairing.

## Testable acceptance criteria for downstream TB-V planning

- A plan/test spec states V-NOTES-01 hard-error semantics for note body/envelope integrity.
- A plan/test spec states V-NOTES-02 warn-not-block semantics for nursing-scope concerns.
- Tests cover `rn`, `lpn`, and `student_nurse` as nursing-scope roles.
- Tests cover `rn_agent` exclusion.
- Tests cover `nurse_practitioner` conditional behavior using subtype/context or an explicit ambiguity warning if subtype/context support is not implemented yet.
- Tests confirm duplicate `note_ref` does not warn/block and preserves earliest-`recorded_at` first-wins projection semantics.
- Tests confirm malformed/missing note frontmatter produces a validator warning, not a hard error, while the view may skip malformed notes.

## Assumptions exposed + resolutions

- **Assumption:** Nursing role membership can be role-only.  
  **Resolution:** Mostly true for `rn`, `lpn`, `student_nurse`; false for `nurse_practitioner`, where subtype/context decides.

- **Assumption:** Duplicate `note_ref` corrupts substrate enough to warn or block.  
  **Resolution:** Rejected for TB-V; accept silently and keep projection semantics.

- **Assumption:** Malformed frontmatter can remain silent everywhere because narrative currently skips malformed notes.  
  **Resolution:** Rejected for TB-V; validator should warn while view remains compatible.

## Pressure-pass findings

Round 3 deliberately challenged Round 2's inclusion of `nurse_practitioner`. The answer narrowed the initial broad membership decision: NP is not nursing by role alone; subtype/context determines whether a specific NP-authored note belongs to nursing scope or provider scope.

## Full transcript summary

- Round 1 (Decision boundaries / rule severity): V-NOTES-01 substrate integrity is hard-error. V-NOTES-02 nursing-scope mismatch is warn-not-block.
- Round 2 (Nursing-role membership): `rn`, `lpn`, and `student_nurse` count as nursing roles. `nurse_practitioner` is included only subject to the Round 3 subtype/context rule. `rn_agent` remains excluded.
- Round 3 (Contrarian pressure pass / NP boundary): `nurse_practitioner` is not role-alone nursing. NP notes count as nursing-scope only when subtype/context explicitly indicates nursing work; otherwise provider-scope/ambiguous per validator design.
- Round 4 (Duplicate note_ref policy): Projection keeps earliest-`recorded_at` first-wins. TB-V adds no warning or hard error for duplicate `note_ref`.
- Round 5 (Malformed-note frontmatter policy): Keep the view silent-skip behavior, but TB-V validator should emit a warning for malformed/missing required note frontmatter.

## Recommended execution bridge

Recommended next lane: `$ralplan` with this spec as source of truth.

Invocation contract:

```bash
$plan --consensus --direct .omx/specs/deep-interview-a6-a7-notes-translation-hitl.md
```

Alternative handoffs:

- `$autopilot .omx/specs/deep-interview-a6-a7-notes-translation-hitl.md` if direct planning + execution is desired.
- `$ralph .omx/specs/deep-interview-a6-a7-notes-translation-hitl.md` if a persistent single-owner execution loop is desired after planning gates are satisfied.
- `$team .omx/specs/deep-interview-a6-a7-notes-translation-hitl.md` if validator implementation/test work becomes coordination-heavy.
- Refine further only if the user wants additional policy pressure, because all required readiness gates are now satisfied.
