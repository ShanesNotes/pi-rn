# artifacts/

Native binary files referenced from events (PDFs, images, waveforms).
Register each with a matching `artifact_ref` event in the day's
`events.ndjson` via `writeArtifactRef(...)` from `src/index.ts`.
