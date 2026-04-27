# Context Snapshot: Deslop Actual Code

## Task Statement

Run a deslop/cleanup pass across every actual code file in `pi-chart`.

## Desired Outcome

- Inspect all TypeScript source/test/script files plus package/TypeScript config.
- Make only behavior-preserving cleanup edits.
- Preserve existing Phase A foundation changes and user-owned A3 research files.
- Verify with typecheck, tests, rebuild, and validation.

## Known Facts / Evidence

- Code scope: 43 TypeScript files plus `package.json` and `tsconfig.json`.
- Existing worktree already contains Phase A foundation changes from the prior Ralph pass.
- Two untracked A3 research artifacts exist and are treated as user work:
  - `clinical-reference/phase-a/a3-vital-signs-synthesis.md`
  - `clinical-reference/phase-a/a3-open-schema-entries-synthesis.md`
- Current test command includes source and script tests.

## Constraints

- No new dependencies.
- Do not change clinical behavior or schema semantics during deslop.
- Use `apply_patch` for edits.
- Do not touch research prose or patient chart files unless code verification requires it.
- Keep diffs small and reversible.

## Unknowns / Open Questions

- Some `any` usage is likely structural because JSON schema validation and YAML parsing are dynamic.
- CLI `console.log` usage is expected and should not be removed.
- Tests use casts deliberately to create malformed inputs.

## Likely Codebase Touchpoints

- `src/read.ts`, `src/views/currentState.ts`, `src/views/trend.ts`, `src/views/timeline.ts`
- `src/derived.ts`
- Tests only if cleanup requires assertion updates.

