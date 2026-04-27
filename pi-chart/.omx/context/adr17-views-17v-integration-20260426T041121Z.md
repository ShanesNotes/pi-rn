# Context Snapshot — ADR17 views and 17V integration

- Task: consensus-plan execution handoff for docs/plans/handoff-adr17-17b-17c-views-and-17v-integration.md
- Desired outcome: final approved ralplan artifact with lane sequencing, ownership, acceptance criteria, staffing, launch hints, and verification path.
- Known facts: three lanes: 17b-VIEW owns src/views/reviewState.ts(.test.ts); 17c-VIEW owns src/views/attestationState.ts(.test.ts); 17V owns schemas/profiles/index.json and src/validate.ts(.test.ts).
- Constraints: view lanes must not register profiles or validator rules; 17V starts only after at least one view-lane failing test names V-REVIEW-* or V-ATTEST-*; 17V rules use per-rule RED/GREEN commit discipline; no off-scope decisions/docs/patient rewrites except scoped fixture prefixes.
- Unknowns: exact existing package scripts and validator code line numbers must be confirmed before execution.
- Likely touchpoints: src/views/projection.ts, src/validate.ts, src/validate.test.ts, schemas/profiles/index.json, new src/views/reviewState.ts/test, new src/views/attestationState.ts/test.
