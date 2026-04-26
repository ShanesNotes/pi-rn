# Test spec — Context bundle implementation (CB-001)

Status: accepted
PRD: `docs/plans/prd-context-bundle-implementation.md`
Implementation: `src/views/bundle.ts`, `src/views/bundle.test.ts`, `src/views/index.ts` re-export.

## Targeted verification

```bash
node --test --import tsx src/views/bundle.test.ts
```

Expected: all bundle tests pass; failure means contract drift.

## Regression

```bash
npm test
npm run typecheck
npm run check
```

Expected: full test suite passes; typecheck clean; chart validator reports `0 error(s), 0 warning(s) across 2 patient(s)`.

## Boundary check

```bash
git diff --name-only -- src schemas patients scripts | grep -vE 'src/views/(bundle\.ts|bundle\.test\.ts|index\.ts)$'
```

Expected: empty stdout. Any other product-root file in the diff means CB-001 has overstepped its boundary.

## Test coverage assertions

`src/views/bundle.test.ts` must cover, at minimum:

1. **Contract keys present.** Bundle output contains exactly: `patient_id`, `asOf`, `source_view_refs`, `current_state`, `open_loops`, `narrative_handoff`, `evidence_context`, `recent_timeline`.
2. **View-derivation parity.** For the same scope and `asOf`, each bundle section equals the result of calling its underlying projection directly (`currentState`, `openLoops`, `narrative`, `timeline`, `memoryProof`).
3. **Export surface.** `contextBundle` is reachable via `import { contextBundle } from '../views/index.js'`, and the three public types (`ContextBundle`, `ContextBundleParams`, `EvidenceContext`) are exported.
4. **Forbidden wrapper keys absent.** Output does NOT contain any of: `fingerprint`, `bundle_hash`, `logical_id`, `prev_hash`, `invalidated_at`, `profile`, `simulator_state`, `hidden_state`.
5. **Encounter-scoped narrowing.** When `encounterId` is provided, narrative and timeline sections respect that filter (delegated to underlying projections).

## Forbidden surfaces (must remain absent in repo)

- `src/hash.ts`
- `src/identity.ts`
- `schemas/profile.schema.json`
- root `profiles/`
- any deterministic-fingerprint helper attributable to CB-001

## Acceptance evidence cross-reference

Acceptance report at `docs/plans/s5-read-side-context-bundle-acceptance-report.md` is canonical evidence for CB-001 (header rewritten to reference this PRD as authority).
