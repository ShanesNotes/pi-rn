# Deep Interview Transcript — a6/a7 notes translation HITL

- Created: 20260426T190225Z
- Profile: standard
- Context type: brownfield
- Source plan: `/home/ark/.claude/plans/ralplan-a6-a7-notes-translation.md`
- Context snapshot: `.omx/context/a6-a7-notes-translation-hitl-20260426T185515Z.md`
- Final ambiguity: 5.4%
- Threshold: 20.0%

## Final decisions

1. **Rule severity:** V-NOTES-01 substrate integrity is a hard error; V-NOTES-02 nursing scope is warn-not-block.
2. **Nursing role membership:** `rn`, `lpn`, and `student_nurse` count as nursing scope. `nurse_practitioner` is conditional on subtype/context. `rn_agent` remains excluded.
3. **NP boundary:** `nurse_practitioner` is not role-alone nursing; subtype/context decides.
4. **Duplicate note_ref:** accept silently; keep earliest-`recorded_at` first-wins projection semantics.
5. **Malformed note frontmatter:** view may skip silently; TB-V validator warns.

## Transcript

### Round 1 — Decision boundaries / rule severity

**Question:** For the follow-up TB-V validator slice, which severity posture should be binding for notes rules?

**Answer:** Hard substrate, soft scope (`vnotes01-hard-vnotes02-warn`).

**Captured decision:** V-NOTES-01 substrate integrity is hard-error. V-NOTES-02 nursing-scope mismatch is warn-not-block.

### Round 2 — Nursing-role membership

**Question:** Which additional author roles should join nursing scope beyond `rn`?

**Answer:** `lpn`, `student_nurse`, `nurse_practitioner`.

**Captured decision:** `rn`, `lpn`, and `student_nurse` count as nursing roles. `nurse_practitioner` is included only subject to the Round 3 subtype/context rule. `rn_agent` remains excluded.

### Round 3 — Contrarian pressure pass / NP boundary

**Question:** Including `nurse_practitioner` may blur provider-vs-nursing semantics. Which rule should TB-V use when an NP-authored note appears?

**Answer:** Subtype/context decides.

**Captured decision:** `nurse_practitioner` is not role-alone nursing. NP notes count as nursing-scope only when subtype/context explicitly indicates nursing work; otherwise provider-scope/ambiguous per validator design.

### Round 4 — Duplicate note_ref policy

**Question:** If multiple `communication` events reference the same `data.note_ref`, what should validation do?

**Answer:** Accept silently.

**Captured decision:** Projection keeps earliest-`recorded_at` first-wins. TB-V adds no warning or hard error for duplicate `note_ref`.

### Round 5 — Malformed-note frontmatter policy

**Question:** What should happen when a Markdown note has malformed or missing required frontmatter such that `id` or `recorded_at` cannot be parsed?

**Answer:** Warn malformed notes.

**Captured decision:** Keep the view silent-skip behavior, but TB-V validator should emit a warning for malformed/missing required note frontmatter.

## Readiness gates

- Non-goals: explicit. The current implementation lane remains view-only and does not edit validators/schemas/patients/narrative.
- Decision boundaries: explicit for TB-V rule severity, role membership, duplicate `note_ref`, and malformed frontmatter.
- Pressure pass: complete. Round 3 revisited the Round 2 role-membership expansion and constrained `nurse_practitioner` to subtype/context rather than role-alone nursing.
