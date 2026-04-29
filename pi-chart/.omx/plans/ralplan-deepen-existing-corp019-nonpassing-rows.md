# RALPLAN — Deepen existing CORP-019 non-passing rows in place

## Status

- Date: 2026-04-29
- Repo: `/home/ark/pi-rn/pi-chart`
- Mode: `$ralplan` amendment; planning only.
- Supersedes: `.omx/plans/ralplan-revise-corp019-two-signed-anchors.md`
- Context snapshot: `.omx/context/deepen-corp019-existing-nonpassing-patients-20260429T015841Z.md`
- Trigger: operator clarified they do **not** want replacement patients; they want to deepen the existing current-series rows that did not pass signoff.

## RALPLAN-DR summary

### Principles

1. **Preserve the five-row series**: do not create `patient_006`-`patient_008`; improve current rows in place.
2. **Operator signoff remains the gate**: machine validation is necessary but does not equal reviewed clinical acceptance.
3. **No invented failure rationale**: if exact operator objections are absent, deepen objective corpus dimensions rather than pretending we know why a row failed.
4. **Keep accepted anchors stable**: do not churn `patient_002` or `patient_004` except for docs/ledger cross-references.
5. **No ADR019 readiness overclaim**: two accepted anchors plus three revised candidates is still pending review, not readiness.

### Decision drivers

1. User corrected the plan: they want in-place depth improvements, not replacement patients.
2. The current corpus already has `patient_001` through `patient_005`; preserving IDs reduces review churn and keeps provenance simple.
3. `patient_002` and `patient_004` are the only accepted anchors; `patient_001`, `patient_003`, and `patient_005` should become revised review candidates, not counted evidence yet.

### Viable options

#### Option A — Recommended: deepen `patient_001`, `patient_003`, and `patient_005` in place

Run a bounded Ralph lane that freezes `patient_002`/`patient_004`, then improves the non-accepted existing rows across objective clinical-corpus depth dimensions: longitudinal continuity, evidence traceability, nursing assessments, open-loop follow-up, risk/uncertainty handoff, and checklist honesty.

Pros:
- Matches user clarification exactly.
- Preserves current row IDs and existing review context.
- Avoids creating extra corpus volume.
- Keeps all work repo-local and verifiable.

Cons:
- Without concrete operator objection notes, some improvements are best-effort rather than targeted.
- In-place revisions require careful ledger wording so prior non-acceptance is not erased.

#### Option B — Deepen only `patient_003` and `patient_005`

Treat `patient_001` as a seed/out-of-scope row and revise only the recently generated non-accepted rows.

Pros:
- Smaller edit surface.
- Less risk of disturbing older seed material.

Cons:
- Leaves only four plausible rows in the current five-row series if `patient_001` remains unreviewable.
- May not satisfy “build out of the 5 patients” if all five current IDs must be review candidates.

#### Option C — Wait for detailed operator objections before editing

Pause implementation until the operator lists exact reasons each row failed.

Pros:
- Most targeted repairs.
- Lowest risk of polishing the wrong dimensions.

Cons:
- Blocks progress even though safe, objective deepening work is available.
- Conflicts with autonomous execution preference.

## ADR

### Decision

Proceed with **Option A**: deepen `patient_001`, `patient_003`, and `patient_005` in place as revised review candidates. Do not generate replacement patients.

### Drivers

- Direct user correction overrides the prior replacement-row plan.
- Existing corpus identity matters for review continuity.
- The safest autonomous path is objective deepening plus honest ledger updates, not guessing subjective signoff reasons.

### Alternatives considered

- Generate `patient_006`-`patient_008`: rejected because user explicitly clarified they do not want replacements.
- Deepen only `patient_003`/`patient_005`: rejected as the default because `patient_001` is also not signed off in the current five-row group; execution may still leave `patient_001` untouched if preflight proves it already meets the intended depth and only lacks a checklist.
- Wait for more rejection detail: deferred; add fields/placeholders for operator objections but do not block objective improvements.

### Why chosen

This produces the closest plan to the user's actual goal: keep the current five-patient series, stabilize accepted rows, improve non-accepted rows enough for a new operator review pass, and preserve review honesty.

### Consequences

- `patient_002` and `patient_004` remain the only accepted anchors.
- `patient_001`, `patient_003`, and `patient_005` become revised review candidates after in-place deepening and validation.
- CORP-019 is not readiness-complete until those revised rows receive operator pass/conditional-pass signoff and ADR018 dependencies are handled.

### Follow-ups

- Operator reviews revised `patient_001`, `patient_003`, and `patient_005` with checklists.
- If any still fail, create a targeted repair lane using the explicit objections.

## Recommended execution sequence

### Phase 0 — Boundary + validation preflight

Capture current state before edits:

```bash
git status --short -- . ../pi-sim
find decisions -maxdepth 1 -name '019-*' -print
npm run validate
npm run validate -- --patient patient_001
npm run validate -- --patient patient_003
npm run validate -- --patient patient_005
```

Expected: validation should be green or have known warnings only. If a touched patient has validation errors, repair those first and document the difference between validation fixes and clinical-depth edits.

### Phase 1 — Freeze accepted anchors and ledger

Use the existing CORP-019 PRD/test-spec pair as the requirements/test-intent gate:

- `docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`
- `docs/plans/test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`

Important scope clarification: those artifacts describe the original CORP-019 docs-first slice and contain older no-fixture boundaries. This amended RALPLAN supersedes that older write boundary **only** for the explicit in-place deepening write set below (`patient_001`, `patient_003`, `patient_005`, derived outputs, packet/checklists, and narrowly optional existing-row proof metadata). The PRD/test-spec still governs the review gate, evidence honesty, and validation expectations; it does not authorize replacement patients or ADR019 readiness claims.

Write set:

- `docs/plans/clinical-fidelity-corpus-review-adr-019.md`
- `docs/plans/patient-004-operator-review-checklist.md` only for accepted-anchor signoff/ledger wording if needed

Tasks:

1. Record `patient_002` and `patient_004` as accepted/signed-off anchors only to the extent the user has confirmed.
2. Record `patient_001`, `patient_003`, and `patient_005` as not-yet-accepted / revise-for-review candidates.
3. Do not imply any revised row counts toward the five reviewed rows until operator review occurs.
4. Do not change `patient_002` or `patient_004` clinical content.

Acceptance:

- Corpus packet ledger is explicit: accepted (`patient_002`, `patient_004`); revision candidates (`patient_001`, `patient_003`, `patient_005`); no replacement patients planned.
- Packet still says ADR019 readiness is not claimed.

### Phase 2 — Deepen `patient_001` in place

Write set:

- `patients/patient_001/**`
- generated `patients/patient_001/_derived/**`
- `docs/plans/clinical-fidelity-corpus-review-adr-019.md`
- optional new `docs/plans/patient-001-operator-review-checklist.md`
- `src/views/memoryProof.test.ts` only if existing corpus-proof expectations need to include/tighten `patient_001`

Deepening targets:

1. Ensure one clear proof fact ties assessment, evidence, plan/open loop, narrative note, and handoff.
2. Add or tighten nursing-relevant continuity: shift-to-shift change, risk, intervention, reassessment, and unresolved follow-up.
3. Make clinical uncertainty and next action explicit without overfitting or adding schema/runtime changes.
4. Create an operator checklist if missing, marked `operator-review-pending`.

Acceptance:

- `npm run rebuild -- --patient patient_001` passes.
- `npm run validate -- --patient patient_001` passes.
- Checklist/packet say revised candidate, not accepted evidence.

### Phase 3 — Deepen `patient_003` in place

Write set:

- `patients/patient_003/**`
- generated `patients/patient_003/_derived/**`
- `docs/plans/patient-003-operator-review-checklist.md`
- `docs/plans/clinical-fidelity-corpus-review-adr-019.md`
- `src/views/memoryProof.test.ts` only if proof semantics need tightening for existing rows

Deepening targets:

1. Strengthen longitudinal continuity across events instead of isolated snapshots.
2. Make evidence chains clinically meaningful: source observation/lab/assessment → interpretation → nursing action → reassessment/open loop.
3. Improve handoff specificity: what changed, what remains uncertain, what must be checked next shift.
4. Keep rejection/signoff history honest: revised-for-review, not accepted.

Acceptance:

- `npm run rebuild -- --patient patient_003` passes.
- `npm run validate -- --patient patient_003` passes.
- memoryProof coverage remains green and the checklist is operator-review-ready.

### Phase 4 — Deepen `patient_005` in place

Write set:

- `patients/patient_005/**`
- generated `patients/patient_005/_derived/**`
- `docs/plans/patient-005-operator-review-checklist.md`
- `docs/plans/clinical-fidelity-corpus-review-adr-019.md`
- `src/views/memoryProof.test.ts` only if proof semantics need tightening for existing rows

Deepening targets:

1. Preserve the post-op/frailty/delirium/fall-risk axis.
2. Add richer continuity around delirium/falls: precipitating factors, prevention bundle, mobility/assist level, pain/sedation tradeoff, family/care-team communication, and next-shift reassessment.
3. Ensure the proof fact is reused across assessment/evidence/open-loop/narrative/handoff without shallow repetition.
4. Keep checklist status as revised-for-review until operator signoff.

Acceptance:

- `npm run rebuild -- --patient patient_005` passes.
- `npm run validate -- --patient patient_005` passes.
- Packet/checklist reflect revised candidate status, not accepted evidence.

### Phase 5 — Final corpus verification and handoff

Run full verification:

```bash
find decisions -maxdepth 1 -name '019-*' -print
git status --short -- . ../pi-sim
python3 - <<'PYGUARD'
from pathlib import Path
import subprocess
allowed_exact = {
    '.omx/plans/ralplan-deepen-existing-corp019-nonpassing-rows.md',
    'docs/plans/clinical-fidelity-corpus-review-adr-019.md',
    'docs/plans/patient-001-operator-review-checklist.md',
    'docs/plans/patient-003-operator-review-checklist.md',
    'docs/plans/patient-004-operator-review-checklist.md',
    'docs/plans/patient-005-operator-review-checklist.md',
    'src/views/memoryProof.test.ts',
    'pi-chart.yaml',
}
allowed_prefix = (
    '.omx/plans/plan-patient-001-',
    '.omx/plans/plan-patient-003-',
    '.omx/plans/plan-patient-005-',
    'patients/patient_001/',
    'patients/patient_003/',
    'patients/patient_005/',
)
for forbidden in ['patients/patient_006', 'patients/patient_007', 'patients/patient_008']:
    if Path(forbidden).exists():
        raise SystemExit(f'forbidden replacement patient exists: {forbidden}')
status = subprocess.check_output(['git', 'status', '--porcelain=v1', '--', '.'], text=True)
bad = []
for line in status.splitlines():
    path = line[3:]
    if ' -> ' in path:
        path = path.split(' -> ', 1)[1]
    if path in allowed_exact or any(path.startswith(prefix) for prefix in allowed_prefix):
        continue
    bad.append(path)
if bad:
    raise SystemExit('out-of-write-set pi-chart changes:' + chr(10) + chr(10).join(bad))
print('allowed-write guard: PASS')
PYGUARD
npm run rebuild -- --patient patient_001
npm run validate -- --patient patient_001
npm run rebuild -- --patient patient_003
npm run validate -- --patient patient_003
npm run rebuild -- --patient patient_005
npm run validate -- --patient patient_005
npm run typecheck
npm test
npm run validate
```

Acceptance:

- No `decisions/019-*` output.
- No `../pi-sim` edits attributable to this work.
- Changed/untracked path ledger is manually checked against the allowed write set; any out-of-set path is reverted or reported as pre-existing/unowned with evidence.
- Direct check confirms no `patients/patient_006`, `patients/patient_007`, or `patients/patient_008` directory exists.
- Full validation/typecheck/tests pass or any unrelated pre-existing blocker is explicitly separated.
- Final report lists changed files, deepening done, signed anchors, revised candidates, and remaining operator-review risks.

## Allowed write set for `$ralph`

- `.omx/plans/ralplan-deepen-existing-corp019-nonpassing-rows.md`
- optional `.omx/plans/plan-patient-001-*.md`, `.omx/plans/plan-patient-003-*.md`, `.omx/plans/plan-patient-005-*.md`
- `patients/patient_001/**`
- `patients/patient_003/**`
- `patients/patient_005/**`
- generated `patients/patient_001/_derived/**`
- generated `patients/patient_003/_derived/**`
- generated `patients/patient_005/_derived/**`
- `docs/plans/clinical-fidelity-corpus-review-adr-019.md`
- `docs/plans/patient-004-operator-review-checklist.md` only for accepted-anchor signoff/ledger wording if needed
- optional `docs/plans/patient-001-operator-review-checklist.md`
- `docs/plans/patient-003-operator-review-checklist.md`
- `docs/plans/patient-005-operator-review-checklist.md`
- `src/views/memoryProof.test.ts` only if existing corpus-proof semantics need tightening
- `pi-chart.yaml` only if existing `patient_001`/`patient_003`/`patient_005` registration metadata is missing or stale

## Forbidden changes

- No new replacement patient directories (`patients/patient_006/**`, `patients/patient_007/**`, `patients/patient_008/**`).
- No `../pi-sim/**` edits.
- No `decisions/019-*` files.
- No package, schema, importer, or runtime changes.
- No ADR019 readiness claim.
- No changes to accepted-anchor clinical content for `patient_002` or `patient_004`.

## Available-agent-types roster

- `executor` — patient fixture/docs/test edits.
- `test-engineer` — verification and regression coverage.
- `verifier` — boundary and acceptance validation.
- `architect` — review corpus structure and overclaim risks.
- `critic` — challenge plan honesty and no-replacement compliance.
- `writer` — operator checklist and packet wording.
- `explore` — read-only mapping of current patient package state.

## Follow-up staffing guidance

### Recommended `$ralph` path

Use one sequential owner because patient packages share packet/test wording and signoff language is sensitive.

Suggested launch:

```text
$ralph Execute .omx/plans/ralplan-deepen-existing-corp019-nonpassing-rows.md in /home/ark/pi-rn/pi-chart. Do not create replacement patients. Freeze patient_002 and patient_004 as the only accepted anchors, then deepen patient_001, patient_003, and patient_005 in place as revised-for-review candidates. Use only the allowed write set in the plan. Do not touch ../pi-sim, do not create decisions/019-*, do not change package/schema/importer/runtime files, and do not claim ADR019 readiness. Verify scoped rebuild/validate for patient_001, patient_003, and patient_005, then run typecheck, tests, full validate, boundary git status, and forbidden-decision check.
```

### Optional `$team` path

Use only if speed matters and shared-file ownership is explicit.

- Worker 1: `patient_001` package + checklist only.
- Worker 2: `patient_003` package + checklist only.
- Worker 3: `patient_005` package + checklist only.
- Leader/writer: owns shared packet, optional `src/views/memoryProof.test.ts`, optional `pi-chart.yaml`, and final verification.
- Verifier: runs final commands and boundary checks.


## Review iteration notes

- 2026-04-29 architect ITERATE resolved:
  - Added `docs/plans/patient-004-operator-review-checklist.md` to the global allowed write set for accepted-anchor ledger wording.
  - Clarified that the existing PRD/test-spec govern CORP-019 review/test intent, while this amended RALPLAN supersedes their older no-fixture boundary only for explicit `patient_001`/`patient_003`/`patient_005` deepening writes.
  - Added a mechanical no-replacement-patient guard and explicit allowed-write-set ledger check to final verification.
