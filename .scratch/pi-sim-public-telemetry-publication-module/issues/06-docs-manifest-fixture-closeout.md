# Close documentation, manifest, and fixture consistency

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-sim-public-telemetry-publication-module/PRD.md`

## What to build

After any accepted internal Module design or source refactor, close public documentation, manifest, and fixture consistency without turning fixtures into ABI authority.

## Acceptance criteria

- [ ] `pi-sim/vitals/README.md` and `pi-sim/vitals/.lanes.json` remain consistent for all public lanes and stay the public Interface authority.
- [ ] Fixture README and public-contract fixtures remain regression evidence only.
- [ ] Fixtures do not include hidden scenario truth, scoring keys, future findings, sibling/runtime import paths, or hidden provider internals.
- [ ] Waveform fixtures preserve explicit `sourceKind`, `fidelity`, and `synthetic` labels when waveform samples are present.
- [ ] Consumer-style checks continue to read only public fixtures and public lane files.
- [ ] Closeout evidence names `npm test --prefix pi-sim` when source or fixture files are changed.

## Blocked by

- `issues/03-design-internal-publication-module-interface.md` if a Module seam is accepted.
- Any future source/fixture implementation issue that changes maintainer-relevant publication behavior.

## Comments

- 2026-05-03: Documentation updates are deferred until there is accepted implementation design or a verified README/manifest mismatch.
