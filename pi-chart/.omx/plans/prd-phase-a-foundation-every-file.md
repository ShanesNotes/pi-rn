# PRD: Phase A Foundation Every-File Pass

## Intent

Prepare the `pi-chart` foundation for Phase A implementation by inspecting every repository file and resolving code/documentation gaps that would block or mislead implementation of Phase A research artifacts.

## Scope

- Review every source, schema, script, fixture, seed chart, and project documentation file.
- Compare implementation against Phase A A0-A3 expectations where available.
- Apply low-risk foundation fixes directly.
- Document unresolved design questions rather than silently deciding high-impact schema choices.

## Acceptance Criteria

- A file inventory pass covers all repo files except generated/cache/log state, binary artifacts, and dependency directories.
- Any implementation changes have focused regression tests.
- Public API remains type-safe.
- Seed chart rebuilds and validates cleanly.
- Full tests pass.
- Remaining risks are explicit.

## Non-Goals

- Do not implement the full A3 artifact.
- Do not finalize unresolved Phase A open-schema decisions such as V-CON-01 read receipt.
- Do not add dependencies.
- Do not alter hidden simulator boundaries.

