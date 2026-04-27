# Autopilot Spec: Deslop Actual Code

## Requirements

- Review every actual code file: all `src/**/*.ts`, `scripts/**/*.ts`, `package.json`, and `tsconfig.json`.
- Keep cleanup behavior-preserving.
- Remove avoidable repetition, noisy casts, dead code, or ambiguous helper behavior when a small safe edit exists.
- Do not broaden into Phase A domain feature implementation.

## Acceptance Criteria

- Every code file is covered by inspection or scoped automated scan.
- Any edits are small and have existing or added regression coverage.
- `npm run typecheck`, `npm test`, and `npm run check` pass.
- Multi-perspective validation approves or no blocking issues remain.

