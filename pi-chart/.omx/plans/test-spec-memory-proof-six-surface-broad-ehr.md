# Test spec — Memory-proof projection over six-surface broad EHR skeleton

## Test objective

Verify that Workstream A produces a deterministic, evidence-backed memory-proof
projection over a coherent six-surface broad EHR fixture without adding
speculative standards/governance scope.

## Acceptance coverage matrix

| Acceptance criterion | Required test evidence |
| --- | --- |
| Six-surface fixture exists | Fixture assertions find vitals, nursing assessment, note/narrative, order/intervention, lab/diagnostic, care plan/handoff events in one patient story. |
| Projection has six sections | Unit test asserts required section keys and JSON-serializable shape. |
| Evidence/provenance visible | Projection items include event ids / EvidenceRefs / source metadata for clinically meaningful claims. |
| Chart-once-project-many reuse | Test identifies one bedside observation event id reused in assessment/review, narrative, open loop/care plan, and evidence section. |
| Deterministic output | Run projection/rebuild twice and compare byte-identical JSON/Markdown. |
| `asOf` replay works | Tests assert earlier `asOf` excludes later content from all sections, evidence/provenance nodes, narrative/note references, and open-loop/handoff content; later `asOf` includes it. |
| No hidden simulator coupling | Static/path test or review confirms fixture/projection reads only `patients/**` chart data and view APIs. |
| Existing quality gates pass | `npm test`, `npm run typecheck`, `npm run check`. |

## Unit tests

### `src/views/memoryProof.test.ts` or equivalent

1. `memoryProof returns six required sections`
   - Seed fixture data.
   - Assert sections: `what_happened`, `why_it_mattered`, `evidence`,
     `uncertainty`, `open_loops`, `next_shift_handoff`.

2. `memoryProof is JSON-serializable`
   - `JSON.stringify` then `JSON.parse`.
   - Assert no `Date`, stream, or function values.

3. `memoryProof preserves asOf replay`
   - Run before diagnostic result time.
   - Run after diagnostic result time.
   - Assert diagnostic/lab evidence appears only in later projection.
   - Assert no future content appears in section items, evidence/provenance
     nodes, narrative/note references, or open-loop/handoff content.

4. `memoryProof reuses one bedside observation across projection contexts`
   - Choose a specific event id, e.g. work-of-breathing finding.
   - Assert the same id appears in evidence, why-it-mattered/review, note or
     narrative linkage, and handoff/open-loop/care-plan section.
   - Check structured graph reachability, not only rendered text:
     - assessment/review support contains the event id;
     - note/reference or communication support contains the event id;
     - open-loop, care-plan, or handoff support links back to the event id
       directly or through the assessment;
     - memory-proof evidence/provenance output carries the event id.

5. `memoryProof does not leak future evidenceChain content`
   - If `memoryProof` composes `evidenceChain`, seed a future supporting event
     or note and assert an earlier `asOf` excludes it.
   - If `memoryProof` does not compose `evidenceChain`, assert projection
     evidence is bounded by the projection's resolved `asOf`.

6. `memoryProof surfaces open loops`
   - Pending lab/order/reassessment intent appears in open-loop section until
     resolved/fulfilled.

7. `memoryProof surfaces uncertainty`
   - Differential, missing data, questionable signal, or contradiction appears
     in uncertainty section when present.

## Fixture tests

Add a test that validates fixture completeness:

- one patient story;
- at least one event or note per six-surface category;
- all clinical events carry source, author, effective time/period, recorded
  time, status;
- assessment has support links;
- intents/actions demonstrate an open or fulfilled loop;
- lab/diagnostic data affects projection content.

## Derived output tests

If `_derived/memory-proof.md` is added:

1. `rebuildDerived emits memory-proof.md`
2. `memory-proof.md has generated header`
3. `memory-proof.md is byte-identical across repeated rebuilds`
4. `memory-proof.md includes required headings`

## Regression tests

- Existing view tests still pass.
- Existing derived outputs remain stable except intentional new file.
- Existing validator invariants remain green.
- No schema loosening to force fixture data through validation.

## Verification commands

```bash
npm test
npm run typecheck
npm run check
```

Optional manual inspection:

```bash
cat patients/<fixture_patient>/_derived/memory-proof.md
```

Manual pass condition: a clinician/operator can answer:

- What changed?
- Why did it matter?
- What evidence supports it?
- What remains uncertain?
- What is pending?
- What should the next clinician or agent watch?

## Known non-tests / deferred

- FHIR export correctness.
- Attestation/cosign enforcement.
- Read-path audit logging.
- Legal retention/redaction behavior.
- UI rendering.
