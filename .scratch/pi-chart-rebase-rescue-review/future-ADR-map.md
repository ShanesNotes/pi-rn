# Future ADR map

Status: rescue review artifact

Purpose: identify decisions that should become explicit ADRs instead of hidden implementation assumptions.

| ADR candidate ID | Decision topic | Triggering evidence | Alternatives required | Decision owner | Blocking questions | Related idea IDs |
|---|---|---|---|---|---|---|
| ADRC-001 | Agent-native chart / clinical memory north-star wording | User correction; ADR016; GOLD-001 | Keep current “not EHR” wording; revise to agent-native chart; create root cross-subproject wording | architect + maintainer | What exact wording prevents both EHR-clone drift and EHR-rail amnesia? | GOLD-001,GOLD-002 |
| ADRC-002 | ContextPacket and ContextReceipt contract | v0.5 spec prep; GOLD-006; GAP-001/GAP-006 | Packet as artifact vs claim; receipt as ledger claim vs audit record; fail-closed safety floor timing | architect | Which fields are Phase 2 minimum, and what waits for access-plane PRD? | GOLD-004,GOLD-005,GOLD-006 |
| ADRC-003 | Projection authority and chart-once/project-many contract | ADR016; memoryProof/contextBundle; GOLD-003 | Derived projections disposable vs persisted artifacts; projection hashes; source-view refs | pi-chart architect | Which projections are acceptance targets before storage/index choices? | GOLD-003,GOLD-004 |
| ADRC-004 | Review, attestation, and agent proposal governance | ADR017; GOLD-008/GOLD-011 | Governance events as chart claims; projection-only state; access-plane proposal model | architect + security-reviewer | What is the minimum governance primitive before agent outputs are useful? | GOLD-008,GOLD-011 |
| ADRC-005 | Standards posture: FHIR/openEHR boundary adapters | foundation register; EHR-010; GAP-011 | Boundary-only; internal canonical model; defer all standards | architect + researcher | Which first adapter/export target proves value without internal model capture? | GOLD-007,GOLD-013 |
| ADRC-006 | pi-chart to pi-ledger adapter readiness and mechanism | ADR020; adapter readiness gate; foundation matrix | N-API, WASM, CLI/golden vectors, service boundary, or defer | dependency-expert + architect | What kernel interface evidence and mechanism decision are complete? | GOLD-007,GOLD-013 |
| ADRC-007 | Access plane / read-only agent tools | v0.5 access-plane planning; GAP-009 | Read-only MCP over projections; query API; no agent access yet | security-reviewer + architect | Which tools are safe before ContextPacket contract freezes? | GOLD-006,GOLD-010,GOLD-011 |
| ADRC-008 | Clinical workflow/open-loop projection semantics | Phase A workflow/shift-brain; GOLD-009 | Worklist projection; handoff projection; task product module; defer | pi-chart architect + maintainer | Which workflow states are core memory vs UI/product policy? | GOLD-009,GOLD-010 |
| ADRC-009 | Fixture and scenario salvage strategy | patient corpus atlas; GOLD-013 | Synthetic-only; curated patient scenarios after kernel; migrate current patients; external corpus | test-engineer + architect | Which scenario proves chart substrate without overfitting or migrating prototype shape? | GOLD-013 |
| ADRC-010 | Foundation language/storage/dependency posture for pi-chart | user no-sacred-cows directive; foundation matrix | TS chart; Rust chart core; filesystem current/export; append ledger + indexes; service/backend | architect + dependency-expert | What must be proven before a clean pi-chart core implementation starts? | GOLD-001,GOLD-006,GOLD-007 |
