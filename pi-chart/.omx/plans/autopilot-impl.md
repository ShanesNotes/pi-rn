# Autopilot Implementation Plan: Deslop Actual Code

1. Inventory code files and current dirty state.
2. Run broad scans for obvious slop markers: debug leftovers, skipped tests, noisy casts, TODOs, duplicate helper logic.
3. Review code by area:
   - scripts and configs
   - core source modules
   - view modules
   - tests and fixtures
4. Apply only tight behavior-preserving cleanup patches.
5. Run QA gates:
   - `npm run typecheck`
   - `npm test`
   - `npm run check`
6. Run validation review and close Autopilot state.

