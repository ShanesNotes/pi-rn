# Ultragoal brief: clinical-truth service seam planning

Objective: turn the accepted charted-clinical-fact field contract and clinical-truth-service ADRs into an implementation-ready planning substrate for the private pi-ledger clinical-truth service and the pi-chart backend client seam, without implementing production accepted clinical writes in this run.

Success criteria: the run produces durable PRD/test-spec/gap-register artifacts that make the next source-code ultragoal safe; all artifacts preserve patient scope, source-linked chart truth, append-only review/correction semantics, backend-mediated access, and hidden-simulator boundaries; final verification and independent review are clean.

Constraints: do not build the full production clinical-truth service; do not connect browsers, EHR plugins, or pi-agent directly to pi-ledger accepted writes; do not introduce a TypeScript canonicalization/admission clone; do not ingest hidden pi-sim internals; do not treat Shift Brain, Report View, Handoff View, or other clinician surfaces as truth stores; do not choose vector/OpenBrain/retrieval architecture unless a separate decision requires it.

Goal 1 — Baseline and current-state capture: preserve the previous completed ultragoal artifacts, current dirty/untracked state, and baseline verification posture; write a concise current-state artifact for this run.

Goal 2 — Contract inventory and gap register: crosswalk pi-chart field-contract issues 01-15 against pi-ledger ADR-008 safe paths plus ADR-009/021; produce a registry/hash/storage/transport/replay/adapter gap register.

Goal 3 — Versioned clinical-truth service contract PRD and test spec: define private/internal backend-to-service operations only around safe lifecycle paths, including validation/admission/append/revision/point-read/snapshot/rebuild as appropriate.

Goal 4 — Golden-vector and conformance design: specify transport-agnostic vectors for canonical bytes, Record hash, append result, correction-target proof, point-read result, and expected negative errors such as patient mismatch, shape mismatch, stale correction hash, non-canonical timestamps, and caller-supplied K3 metadata.

Goal 5 — Per-patient WAL/log storage and rebuild plan: specify append log record shape, fsync/replay boundaries, head validation, rebuild behavior, corruption handling, and a migration path to later embedded stores behind the same contract.

Goal 6 — Pi-chart adapter test plan before adapter code: specify EventEnvelope, VitalSample, and NoteFrontmatter round-trip fixtures; predicate/object mapping fixtures; EvidenceRef and review/attestation facts; and clinician-surface projection assertions from fields, not stored truth.

Goal 7 — Boundary, security, and access plan: confirm clinical entry points go through the Pi-RN/pi-chart app/backend, the clinical-truth service remains private/internal, public telemetry enters chart truth only through explicit adapter/clinician validation, hidden pi-sim stays hidden, and pi-agent has no direct accepted-write authority.

Goal 8 — Final implementation readiness gate: run verification, ai-slop-cleaner/no-op if appropriate, independent code-reviewer and architect review, and produce a final go/no-go artifact for whether a later ultragoal may implement a small vertical slice.
