# Test Spec — A6/A7 Provider + Nursing notes audit (Pass A)

## Scope

This test spec verifies the round-1 audit PRD `docs/plans/prd-a67-notes-audit.md`. Pass A is **docs-only**: no validator, view, schema, fixture, or test code changes are authorized by this spec. The checks below confirm that the PRD's gap matrix is complete, evidence is cited with file:line precision, the `nursing_note` substrate-correction sub-task is enumerated, and round-2 V-NOTES-04+ rule slots remain PROPOSED-only.

Mirror reference: `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`.

## Structural checks

| Check | Method | Pass condition |
|---|---|---|
| PRD/test-spec pair exists | `test -f docs/plans/prd-a67-notes-audit.md && test -f docs/plans/test-spec-a67-notes-audit.md` | Both files exist. |
| PRD references test-spec | Python substring check | PRD body contains `test-spec-a67-notes-audit.md`. |
| Test-spec references PRD | Python substring check | This spec contains `prd-a67-notes-audit.md`. |
| Status block present | Python substring check | PRD contains the literal anchors `Board card:` and `\`PRD-A67-audit\`` and `PHA-001`. |
| Source authority cited | Python substring check | PRD contains both `a6-provider-notes-council-synthesis.md` and `a7-nursing-notes-council-synthesis.md`. |
| HITL #5 cited | Python substring check | PRD contains `hitl-decisions-26042026.md`. |
| Audit-completeness check | Python loop over council subtypes | Every council subtype name (`admission_note`, `progress_note`, `consult_note`, `procedure_note`, `event_note`, `attestation`, `sbar`, `handoff`, `phone_note`, `focused_note`) appears in the PRD gap matrix. |
| nursing_note site enumeration | Python substring check | At least one site listed; `src/views/memoryProof.test.ts` cited; `patients/patient_002/timeline/2026-04-19/events.ndjson` cited; `patients/patient_002/timeline/2026-04-19/notes/0910_nursing-note.md` cited. |
| Field-name citation | Python substring check | PRD cites `author.role` with file:line evidence at `src/validate.ts:1323` and `src/views/timeline.ts:61`. |
| Connector signature note | Python substring check | PRD documents current API as `buildContextBundle(view, input)` with `scripts/agent-canvas-connector.ts` citation. |
| Round-2 rule slots PROPOSED-only | Python regex check | At least one `V-NOTES-NN` (NN ≥ 04) appears with the literal token `proposed`. |
| Pass-A boundary recorded | Python substring check | PRD `Boundary` section names `src/`, `schemas/`, `patients/`, `clinical-reference/`, `scripts/`, `tests/` as off-limits during round-1. |
| HITL ask block present | Python substring check | PRD contains a `HITL ask block` section naming (a) gap matrix, (b) round-2 V-NOTES-04+ rule slots, (c) nursing_note migration vs exception decision. |
| Cap discipline | Python row count | Subtype audit table has ≤ 14 rows; cross-cutting table has ≤ 8 rows. |

## Validation commands

```bash
test -f docs/plans/prd-a67-notes-audit.md
test -f docs/plans/test-spec-a67-notes-audit.md

python3 - <<'PY'
from pathlib import Path
prd_path = Path('docs/plans/prd-a67-notes-audit.md')
spec_path = Path('docs/plans/test-spec-a67-notes-audit.md')
prd = prd_path.read_text()
spec = spec_path.read_text()

# Pair references.
assert 'test-spec-a67-notes-audit.md' in prd, 'PRD does not reference paired test-spec.'
assert 'prd-a67-notes-audit.md' in spec, 'Test-spec does not reference paired PRD.'

# Status block.
for token in ['PRD-A67-audit', 'PHA-001', 'a6-provider-notes-council-synthesis.md',
              'a7-nursing-notes-council-synthesis.md', 'hitl-decisions-26042026.md']:
    assert token in prd, f'PRD missing status-block token: {token}'

# Audit-completeness — every council subtype anchored in the gap matrix.
council_subtypes = [
    'admission_note', 'progress_note', 'consult_note', 'procedure_note',
    'event_note', 'attestation', 'sbar', 'handoff', 'phone_note', 'focused_note',
]
missing = [s for s in council_subtypes if f'`{s}`' not in prd]
assert not missing, f'Missing council subtypes from gap matrix: {missing}'

# nursing_note site enumeration — count >= 1 site listed.
nursing_sites = [
    'src/views/memoryProof.test.ts',
    'patients/patient_002/timeline/2026-04-19/events.ndjson',
    'patients/patient_002/timeline/2026-04-19/notes/0910_nursing-note.md',
]
present = [s for s in nursing_sites if s in prd]
assert len(present) >= 1, f'nursing_note site enumeration missing all expected anchors; got {present}'

# Field-name citation discipline.
assert 'src/validate.ts:1323' in prd, 'PRD missing src/validate.ts:1323 evidence for author.role envelope field.'
assert 'src/views/timeline.ts:61' in prd, 'PRD missing src/views/timeline.ts:61 evidence for author field.'
if 'data.author_role' in prd:
    rejection_phrases = [
        'NOT `data.author_role`',
        'Not `data.author_role`',
        '**Not** `data.author_role`',
        '**not** `data.author_role`',
        'not `data.author_role`',
    ]
    assert any(p in prd for p in rejection_phrases), \
        'PRD must not silently use data.author_role; it must explicitly reject it.'

# Connector signature note — current API documented.
assert 'buildContextBundle(view, input)' in prd, 'PRD missing current connector API signature.'
assert 'scripts/agent-canvas-connector.ts' in prd, 'PRD missing scripts/agent-canvas-connector.ts citation.'

# Round-2 rule slot discipline.
import re
slots = sorted({int(n) for n in re.findall(r'V-NOTES-(\d{2})', prd)})
round2 = [n for n in slots if n >= 4]
assert round2, 'No round-2 V-NOTES-NN proposed slot found in PRD.'
assert 'proposed' in prd.lower(), 'Round-2 rule slots must be marked proposed-only.'

# Boundary recap — round-1 docs-only.
for forbidden in ['src/', 'schemas/', 'patients/', 'clinical-reference/', 'scripts/', 'tests/']:
    assert forbidden in prd, f'Boundary section missing entry: {forbidden}'

# HITL ask block — three approvals enumerated.
hitl_block = prd.split('## HITL ask block', 1)
assert len(hitl_block) == 2, 'PRD missing HITL ask block section.'
hitl = hitl_block[1].split('\n## ', 1)[0]
for token in ['(a)', '(b)', '(c)', 'gap matrix', 'V-NOTES-04', 'nursing_note']:
    assert token in hitl, f'HITL ask block missing token: {token}'

# Cap discipline — gap matrix ≤ 14 rows; cross-cutting ≤ 8 rows.
def count_table_rows(text, start_marker):
    seg = text.split(start_marker, 1)[1]
    seg = seg.split('\n## ', 1)[0]
    rows = [line for line in seg.splitlines()
            if line.startswith('|') and not line.startswith('|---') and not line.startswith('| #')
            and not re.match(r'\|\s*Council subtype', line)
            and not re.match(r'\|\s*Requirement', line)]
    return rows

gap_rows = count_table_rows(prd, '## Subtype audit (gap matrix)')
xcut_rows = count_table_rows(prd, '## Cross-cutting requirement audit')
assert len(gap_rows) <= 14, f'Subtype audit row cap exceeded: {len(gap_rows)} > 14'
assert len(xcut_rows) <= 8, f'Cross-cutting audit row cap exceeded: {len(xcut_rows)} > 8'

# Sanity-floor: there must be a non-trivial body (gap matrix non-empty, cross-cutting non-empty).
assert len(gap_rows) >= 1, 'Subtype audit table is empty.'
assert len(xcut_rows) >= 1, 'Cross-cutting audit table is empty.'

print('Test-spec A67 verification: OK')
print(f'  council subtypes anchored: {len(council_subtypes) - len(missing)}/{len(council_subtypes)}')
print(f'  nursing_note sites listed: {len(present)}/{len(nursing_sites)} (>=1 required)')
print(f'  round-2 V-NOTES-NN slots: {round2}')
print(f'  gap-matrix rows: {len(gap_rows)} (cap 14)')
print(f'  cross-cutting rows: {len(xcut_rows)} (cap 8)')
PY
```

## Acceptance criteria

1. The PRD `docs/plans/prd-a67-notes-audit.md` and this test-spec both exist as tracked docs.
2. Every A6 (admission, progress, consult, procedure, event, attestation) and A7 (sbar, handoff, progress, admission, event, phone, focused, attestation) council subtype is anchored in the PRD gap matrix.
3. V-NOTES-01/02/03 are recorded as **shipped** with file:line evidence and are not redefined.
4. V-NOTES-04..NN slots are recorded as **proposed-only** for round-2 (Pass B); no validator/view/schema/fixture edits are authorized by this PRD.
5. `author.role` is cited as the envelope field at `src/validate.ts:1323-1326` and `src/views/timeline.ts:61`; `data.author_role` is explicitly rejected as a non-canonical alternative.
6. The current connector signature `buildContextBundle(view, input)` is recorded as the present API, with the `(patientId, encounterId, asOf)` form correctly classified as future direction.
7. The `nursing_note` substrate-correction sub-task enumerates ≥ 1 site (target: all 5 sites across `events.ndjson`, note frontmatter, `memoryProof.test.ts`, and `_derived/memory-proof.md`) and surfaces both HITL options (migrate vs ADR exception).
8. Any round-2 V-NOTES rule that depends on `subtype === 'nursing_note'` is explicitly blocked until HITL resolves the migration-vs-exception decision.
9. Subtype audit table is capped at ≤ 14 rows; cross-cutting requirement audit table is capped at ≤ 8 rows; evidence is linked, not inlined.
10. HITL must approve (a) gap matrix, (b) round-2 V-NOTES-04+ slots, (c) nursing_note disposition before any Pass-B execution card may begin.

## Known gaps

- Pass B (round-2) tracer-bullet PRD is intentionally absent until HITL approves the gap matrix and nursing_note disposition. When authored, it will own validator/view/fixture edits under its own HITL gate.
- Schema-level registration of new subtypes (e.g. `focused_note`) is not part of round-1; it is part of any round-2 schema lane and remains an open-schema question per a7 §16 Q2.
- `data.sbar_sections[]` shape (a7 §16 Q4) and note-section addressability (a6 §16 Q3) remain open-schema questions; this PRD does not propose rules that depend on either.
- Session coupling (a6 §16 Q7) is logged as `V-NOTES-16 (deferred)` rather than `(proposed)`; no round-2 rule may depend on it without HITL/ADR approval first.
