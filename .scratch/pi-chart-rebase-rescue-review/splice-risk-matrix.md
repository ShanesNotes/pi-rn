# Splice-risk matrix

Status: rescue review artifact

Purpose: map what can go wrong when rescuing prototype ideas into future chart, ledger, adapter, or agent work.

| Risk ID | Rescued idea ID | Risk type | Boundary affected | Failure mode | Mitigation | Owner | Blocks promotion? |
|---|---|---|---|---|---|---|---|
| RISK-001 | GOLD-001 | north-star ambiguity | pi-chart | “Not an EHR” is read as “ignore mature EHR memory rails.” | New ADR wording: agent-native clinical chart that reuses EHR rails where clinically meaningful. | architect | no |
| RISK-002 | GOLD-002 | EHR-clone drift | pi-chart | Broad skeleton expands into scheduling/billing/admin/product clone. | Function-first table: every surface must change context, review, documentation burden, or open-loop value. | product/architect | no |
| RISK-003 | GOLD-003 | projection authority leak | pi-chart | Derived note/handoff/open-loop projection becomes canonical truth. | Projection contract must label derived views disposable and source-linked. | pi-chart | yes, until PRD guardrail exists |
| RISK-004 | GOLD-004 | naming/proof overclaim | clinical governance | `memoryProof` name implies cryptographic/legal proof or memory itself. | Rename operational concepts: memory projection, ContextPacket, ContextReceipt. | architect | no |
| RISK-005 | GOLD-005 | premature packet contract | pi-chart | Thin bundle becomes final agent context interface. | Keep as prototype evidence; future ContextPacket ADR owns packet semantics. | pi-chart | yes |
| RISK-006 | GOLD-006 | overdesigned packet | package boundary | ContextPacket absorbs storage, ledger, access plane, and workflow before foundations settle. | ADR separates packet artifact, receipt claim, compiler, and access plane phases. | architect | yes |
| RISK-007 | GOLD-007 | brownfield schema gravity | pi-chart ledger adapter | Brownfield event shape is copied into ledger or new chart core. | Adapter inventory maps semantics, not field-for-field schema. | adapter owner | yes |
| RISK-008 | GOLD-008 | governance overreach | clinical governance | Review/attestation becomes legal/signature machinery too early. | Keep governance primitives; defer institution/legal policy specifics. | security-reviewer/architect | no |
| RISK-009 | GOLD-009 | workflow sprawl | pi-chart | Shift brain/tasks become product center and obscure clinical memory substrate. | Treat worklists as derived workflow projections over canonical chart memory. | pi-chart | no |
| RISK-010 | GOLD-010 | backend premature choice | package boundary | Hot/warm/cold model selects vector/backend/OpenBrain before access needs close. | Define access behavior first; storage/index ADR later. | architect | no |
| RISK-011 | GOLD-011 | direct agent authority | clinical governance | Agent suggestions become accepted clinical truth without review. | Access/review ADR must keep proposal and acceptance distinct. | security-reviewer | yes |
| RISK-012 | GOLD-012 | generated UI gravity | pi-chart | Rendered cockpit visuals define core architecture/API. | Preserve navigation questions only; reject raw UI/design assets as authority. | designer/architect | no |
| RISK-013 | GOLD-013 | fixture overfitting | pi-chart | Patient_002 or curated cases shape kernel identity/storage. | Use patient corpus as scenario pressure after kernel evidence; synthetic kernel fixtures stay separate. | test-engineer | no |
