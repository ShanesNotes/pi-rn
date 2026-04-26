# V03 foundation reconciliation acceptance report

Status: accepted for V03-001 docs-only reconciliation closure
Date: 2026-04-26
Source board: `docs/plans/kanban-prd-board.md`
PRD: `docs/plans/prd-v03-foundation-reconciliation.md`
Test spec: `docs/plans/test-spec-v03-foundation-reconciliation.md`
Brownfield authority: `decisions/015-adr-009-011-implementation.md`
Memo input: `memos/pi-chart-v03-memo.md`

## Tests run

Preflight baseline captured before report authoring:

```bash
mkdir -p .omx/tmp
{
  git diff --name-only -- src schemas patients scripts profiles || true
} | sort > .omx/tmp/v03-product-root-preflight.txt
```

Structural verification from `docs/plans/test-spec-v03-foundation-reconciliation.md`:

```bash
python3 - <<'PY'
from pathlib import Path
prd_path = Path('docs/plans/prd-v03-foundation-reconciliation.md')
spec_path = Path('docs/plans/test-spec-v03-foundation-reconciliation.md')
for path in [prd_path, spec_path]:
    if not path.exists():
        raise SystemExit(f'Missing {path}')
prd = prd_path.read_text()
spec = spec_path.read_text()
text = prd + '\n' + spec
required = [
  'docs/plans/kanban-prd-board.md',
  'ROADMAP.md',
  'memos/pi-chart-v03-memo.md',
  'decisions/009-contradicts-link-and-resolves.md',
  'decisions/010-evidence-ref-roles.md',
  'decisions/011-transform-activity-provenance.md',
  'decisions/015-adr-009-011-implementation.md',
  'decisions/016-broad-ehr-skeleton-clinical-memory.md',
  'decisions/017-actor-attestation-review-taxonomy.md',
  'accepted/current', 'stale/superseded', 'deferred/backlog',
  'needs-ADR/HITL', 'rejected/out-of-scope',
  'proposed/non-canonical', '0.3.0-partial',
]
missing = [item for item in required if item not in text]
if missing:
    raise SystemExit('Missing required V03 terms:\n' + '\n'.join(missing))
for tb in [f'V03-TB-{i}' for i in range(1, 6)]:
    if tb not in prd:
        raise SystemExit(f'Missing tracer bullet {tb}')
for header in ['Owned files', 'First characterization validation', 'Verification command', 'Product-code exclusion']:
    if header not in prd:
        raise SystemExit(f'Missing tracer bullet column: {header}')
PY
```

Brownfield absence/current-state verification from `docs/plans/test-spec-v03-foundation-reconciliation.md`:

```bash
python3 - <<'PY'
from pathlib import Path
expected_absent = [
  Path('profiles'),
  Path('src/hash.ts'),
  Path('src/identity.ts'),
  Path('src/views/bundle.ts'),
  Path('schemas/profile.schema.json'),
]
for path in expected_absent:
    if path.exists():
        raise SystemExit(f'V03 planning expected absent surface to remain absent: {path}')
prd = Path('docs/plans/prd-v03-foundation-reconciliation.md').read_text()
for phrase in [
  'No `profiles/`',
  'No `src/hash.ts`',
  'No `src/identity.ts`',
  'No `src/views/bundle.ts`',
  'No `schemas/profile.schema.json`',
  '`schema_version: 0.3.0-partial`',
]:
    if phrase not in prd:
        raise SystemExit(f'Missing brownfield phrase: {phrase}')
PY
```

Product-root baseline comparison from `docs/plans/test-spec-v03-foundation-reconciliation.md`:

```bash
current=$(mktemp)
git diff --name-only -- src schemas patients scripts profiles | sort > "$current"
if [ -f .omx/tmp/v03-product-root-preflight.txt ]; then
  diff -u .omx/tmp/v03-product-root-preflight.txt "$current"
else
  # Fallback for a clean planning lane: print any product-root edits.
  cat "$current"
  test ! -s "$current"
fi
rm -f "$current"
```

Optional board-row verification was not run because this lane did not edit `docs/plans/kanban-prd-board.md`; no HITL successor selection was available at handoff time.

## Pass/fail evidence

Structural verification transcript:

```text
command: Structural verification
stdout excerpt: <empty; the Python check emits no stdout on success>
stderr excerpt: <empty>
outcome: PASS
exit code: 0
```

Brownfield absence/current-state verification transcript:

```text
command: Brownfield absence/current-state verification
stdout excerpt: <empty; the Python check emits no stdout on success>
stderr excerpt: <empty>
outcome: PASS
exit code: 0
```

Product-root baseline comparison transcript:

```text
command: Product-root baseline comparison
stdout excerpt: <empty; diff emitted no changes relative to .omx/tmp/v03-product-root-preflight.txt>
stderr excerpt: <empty>
outcome: PASS
exit code: 0
```

Preflight baseline contents captured before this report:

```text
pi-chart/scripts/agent-canvas.ts
```

That baseline records pre-existing product-root churn only. The product-root comparison stayed byte-identical after this report was written.

## Deferred items

- `profiles/` registry and `profile` field as v0.3 keystone — bucket `deferred/backlog`. Current repo truth: no `profiles/`, no `schemas/profile.schema.json`, no `src/profiles.ts`, and no event `profile` field. Future authority required: HITL-selected separate ADR/PRD, most directly S4 profile-registry lane.
- `logical_id`, `fingerprint`, `prev_hash`, `invalidated_at` — bucket `deferred/backlog`. Current repo truth: no `src/hash.ts`, no `src/identity.ts`, no hash-chain, no logical-id, and no invalidated-cache implementation. Future authority required: HITL-selected ADR012/ADR013 lane, most directly S3 identity/hash + invalidation lane.
- `contextBundle` helper and bundle fingerprint — bucket `deferred/backlog`. Current repo truth: no `src/views/bundle.ts`; memory proof remains in existing projections. Future authority required: HITL-selected read-side PRD, most directly S5 context-bundle lane.
- Protocols, problem threads, ordersets — bucket `needs-ADR/HITL`. Current repo truth: not current primitives; Phase A A8/A9a may create later pressure. Future authority required: concrete fixture pressure plus separate ADR/PRD before implementation.
- Actor/review/attestation taxonomy — bucket `needs-ADR/HITL`. Current repo truth: ADR17 is proposal/non-canonical until operator disposition, and no schema/profile implementation is authorized by V03-001. Future authority required: HITL accept, revise, split, defer, or reject decision, most directly S2 ADR17 disposition.
- Suppression and incident snapshots — bucket `needs-ADR/HITL`. Current repo truth: not implemented; incident `source.kind` additions are absent. Future authority required: separate safety/governance PRD if selected.
- FHIR/openEHR internal model — bucket `rejected/out-of-scope`. Current repo truth: pi-chart remains a claim-stream internal model with boundary adapters only. Future authority required: explicit boundary-policy change; otherwise keep rejected for core and route adapter work through BND-001.
- Hidden simulator physiology in chart/agent context — bucket `rejected/out-of-scope`. Current repo truth: pi-chart, pi-agent, and pi-sim remain separated; only public observations/artifacts cross the boundary. Future authority required: explicit boundary-policy change; otherwise preserve hidden-sim opacity.

`decisions/015-adr-009-011-implementation.md` remains the accepted implementation authority for the current `schema_version: 0.3.0-partial` reality. It does not authorize the deferred profile, identity/hash, invalidation, or context-bundle proposals from `memos/pi-chart-v03-memo.md`.

## Boundary confirmation

- This V03-001 execution created only `docs/plans/v03-foundation-reconciliation-acceptance-report.md` as a tracked lane artifact.
- No V03 edits were made to `src/`, `schemas/`, `patients/`, `scripts/`, `profiles/`, `decisions/`, `ROADMAP.md`, or `memos/`.
- `.omx/tmp/v03-product-root-preflight.txt` exists as an untracked local baseline artifact and is intentionally not a tracked deliverable.
- Product-root diff after report authoring matched `.omx/tmp/v03-product-root-preflight.txt` exactly.
- Expected-absent V03 surfaces remain absent:
  - `profiles/`
  - `src/hash.ts`
  - `src/identity.ts`
  - `src/views/bundle.ts`
  - `schemas/profile.schema.json`
- Existing unrelated dirty files remain outside this lane: `docs/prototypes/pi-chart-agent-canvas.html`, `package.json`, `package-lock.json`, and `scripts/agent-canvas.ts`.

## Next recommended card

Recommended non-binding next card: S1 Keep V03 deferred / Phase A continuation.

Reasoning: V03-001 proves the memo is reconciled against brownfield reality without granting implementation authority. The current accepted implementation posture is still `0.3.0-partial` under ADR 009/010/011/015/016. The profile, identity/hash, invalidation, and bundle proposals require new HITL-selected authority before code. ADR17 disposition remains a valid decision-only next step if the operator wants governance work first, but it should still be recorded through the S1-S6 HITL choice rather than implied by this reconciliation report.

| Choice | Lane | What it authorizes | Evidence/blocker | Likely cost |
|---|---|---|---|---|
| **S1** Keep V03 deferred | Phase A continuation | Return to broad-EHR skeleton execution under accepted ADR 009/010/011/016 only. | Phase A bridge has landed; V03 proposal items remain deferred until selected. | Lowest — reuses existing accepted posture. |
| **S2** Promote ADR17 decision | ADR17-001 disposition | Operator records accept, revise, split, defer, or reject for ADR17. | ADR17 actor/review/attestation taxonomy remains proposed/non-canonical until HITL disposition. | Decision-only; no new code. |
| **S3** Open ADR012/ADR013 lane | Identity/hash + invalidation | Authorize identity/hash chain or invalidated-at cache planning. | Memo §3.3/§3.4 names this; absent surfaces include `src/hash.ts` and `src/identity.ts`. | New PRD/test-spec; substantial schema impact. |
| **S4** Open profile-registry lane | ADR008/profiles | Authorize profile registry, `profiles/`, `schemas/profile.schema.json`, and event profile field planning. | Memo §3.1/§4 names profiles as a v0.3 keystone, but no accepted authority exists here. | New PRD; touches schema, validator, event model. |
| **S5** Open read-side context-bundle lane | Bundle export | Authorize `src/views/bundle.ts` and bundle fingerprint helper planning. | Memo §5.4 names this; absent surface is `src/views/bundle.ts`. | New PRD; read-only views, narrower than S3/S4. |
| **S6** Reject/defer remaining v0.3 memo proposals | Rejection record | Mark all needs-ADR/HITL and deferred/backlog rows as no-implementation-authority and freeze. | Useful if operator wants to focus on Phase B and avoid V03 proposal drift. | Decision-only; no new code. |
