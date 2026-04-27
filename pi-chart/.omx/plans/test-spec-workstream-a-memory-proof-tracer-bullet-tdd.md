# Test Spec — Workstream A memory-proof tracer-bullet TDD plan

## Scope

Verification contract for `.omx/plans/prd-workstream-a-memory-proof-tracer-bullet-tdd.md`.

The next execution lane hardens the existing Workstream A memoryProof implementation. It does not duplicate the implementation and does not add deferred adapter, UI, attestation, or full EHR scope. The old `patient_001` memo remains the blueprint; `patient_002` is accepted as the realized fixture unless tests show a coverage gap.

## Baseline evidence to preserve

Existing tests already cover:

- six required sections and JSON serializability;
- patient_002 six-surface fixture;
- `asOf` replay across evidence, notes, loops, and handoff;
- vitals evidence-window clamping;
- one bedside WOB observation reused across projection contexts;
- deterministic output;
- derived `memory-proof.md` determinism.

## Required TDD tests

### 1. `noHiddenSimulatorStateLeaksIntoMemoryProof`

**Purpose:** prove memoryProof ignores pi-sim/private simulator state.

Arrange:

1. Build a temporary copy of the chart root or patient_002 fixture.
2. Run `memoryProof({ scope: normal, asOf })`.
3. Add a hidden simulator file such as `_sim_state.json` with keys:
   - `hidden_lung_fluid_ml`
   - `ground_truth_pneumonia_burden`
   - `scheduled_event_queue`
4. Run `memoryProof({ scope: withHiddenState, asOf })`.

Assert:

- Canonical JSON outputs are byte-identical.
- Serialized projection contains none of the forbidden keys.
- No runtime code reads hidden simulator files.

### 2. `singleBedsideObservation_hasNoDuplicateCanonicalPayload`

**Purpose:** strengthen existing reuse test so duplicate canonical bedside assessments fail.

Arrange:

- Load patient_002 events.
- Identify canonical WOB observation `evt_p002_0905_wob`.

Assert:

- Exactly one canonical observation represents the work-of-breathing bedside finding.
- The same event id appears in:
  - why-it-mattered/review,
  - evidence/provenance,
  - open loop/care plan,
  - next-shift handoff.

### 3. `patient002Realization_reconcilesPatient001Blueprint`

**Purpose:** make the fixture substitution explicit.

Assert the acceptance report states:

- Workstream A memo originally described `patient_001`;
- current implementation uses `patient_002`;
- `patient_002` satisfies the six-surface proof unless a test identifies a gap;
- no back-port to `patient_001` is required for this tracer bullet.

### 4. `workstreamAAcceptanceMatrix_isRepresented`

**Purpose:** prevent future confusion about which memo acceptance items are complete, deferred, or intentionally not implemented.

Assert report includes rows for:

- six-surface fixture;
- single observation reuse;
- deterministic projection/render;
- open loop closure semantics;
- evidence chain/provenance reach;
- hidden simulator opacity;
- `asOf` no-future-facts behavior;
- validation without new primitive;
- deferred fingerprint/export if not implemented;
- proposed ADR 017 non-canonical status.

### 5. `memoryProofOpenLoopClosure_isCovered`

**Purpose:** ensure memo acceptance for open-loop closure is executable, not only reported.

Accept either:

- new fixture-specific assertions for patient_002 ABG/care-plan loops, or
- explicit acceptance-report citations to existing coverage: `src/views/openLoops.test.ts:155-163`, `src/views/openLoops.test.ts:165-179`, `src/views/openLoops.test.ts:198-203`, plus `npm run check` for fixture validation without primitive growth.

### 6. `memoryProofFingerprint_hasDecisionRecord`

**Purpose:** prevent silent dropping of memo fingerprint acceptance.

Assert acceptance report either:

- records implemented fingerprint helper/test evidence, or
- records a deferral decision explaining why byte-identical deterministic JSON/Markdown is sufficient now and why fingerprint belongs to later adapter/export planning.

### 7. `memoryProofQualityGates_remainGreen`

Run targeted tests:

```bash
node --test --import tsx src/views/memoryProof.test.ts src/derived.test.ts
```

Run full gates:

```bash
npm test
npm run typecheck
npm run check
```

Pass condition: all commands exit 0.

### 8. `scopeBoundary_noDeferredWorkstreamLeakage`

Search or review changed files.

Fail if the execution adds:

- FHIR/Medplum/HealthChain adapter runtime;
- UI/React Native surfaces;
- actor/attestation/review workflow from proposed ADR 017;
- read-path audit/retention/redaction machinery;
- new top-level event types;
- hidden pi-sim state reads.

## Acceptance report requirements

The execution lane must write or update:

- `.omx/plans/workstream-a-memory-proof-acceptance-report.md`

Required sections:

1. Source inputs.
2. Current implementation evidence.
3. Acceptance matrix.
4. Tests added/changed.
5. Deferred work and rationale, including fingerprint implement-or-defer decision.
6. Patient_001 blueprint vs patient_002 realized-fixture reconciliation.
7. ADR 016 / proposed ADR 017 authority note.
8. Recommended next workstream.

## Verification commands

```bash
node --test --import tsx src/views/memoryProof.test.ts src/derived.test.ts
npm test
npm run typecheck
npm run check
git status --short
```

Boundary grep:

```bash
grep -R --exclude="*.test.ts" "hidden_lung_fluid_ml\|ground_truth_pneumonia_burden\|scheduled_event_queue" src patients || true
```

Pass condition: hidden-state strings appear only in tests or planning/report artifacts, not runtime projection code or canonical patient fixture output. Any grep hit must be classified as `test/planning-ok` or `runtime-fail`; runtime-fail blocks completion.

## Known deferrals

- FHIR/export adapter correctness.
- Fingerprint helper, unless TDD proves it is needed now.
- Actor/attestation/cosign/reject workflow from proposed ADR 017.
- Read-path audit logging.
- Retention/redaction/legal export behavior.
- UI rendering.
