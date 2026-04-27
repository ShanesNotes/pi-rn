# Ralph context — Workstream B actor / attestation / review taxonomy

## Task statement
Continue from Workstream A and execute the next operational step from `memos/deep-research-alignment-24042026.md`: Workstream B item 1, a governance ADR candidate for actor / attestation / review taxonomy. Do not implement runtime schema/code changes yet.

## Desired outcome
A reviewable ADR draft that folds the v0.3 memo §7.1 attestation sketch and deep-research M2/C1 recommendations into a concrete repo-local decision proposal.

## Known facts / evidence
- Workstream A landed a memory-proof projection and broad `patient_002` fixture in the current working tree.
- Alignment memo §10 says B follows A and starts with actor / attestation / review taxonomy covering agent-suggest, agent-action, human-verify, co-sign, supersede, reject states.
- `memos/pi-chart-v03-memo.md` §7.1 sketches `communication.attestation.v1` but does not cover rejection/review taxonomy fully.
- DESIGN/ADR 006 already distinguish `source.kind` and `author.role`; that is necessary but insufficient for durable review state.

## Constraints
- No implementation yet; Workstream B says "draft order; do not implement yet".
- No new dependencies.
- Keep pi-chart substrate-native; FHIR/openEHR are pattern sources only, not internal models.
- Preserve append-only semantics: no mutable review flag on target claims.

## Unknowns / open questions
- Exact profile registry shape remains deferred.
- Whether validation gates are runtime writer rules or profile-driven validator rules remains future implementation detail.
- Which clinical workflows first need enforced cosign is not proven by fixture yet.

## Likely touchpoints
- `decisions/017-actor-attestation-review-taxonomy.md`
- `ROADMAP.md`
- `memos/deep-research-alignment-24042026.md` may remain unchanged unless status tracking is needed.
