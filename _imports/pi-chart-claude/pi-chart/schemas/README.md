# Schemas

JSON Schemas that `scripts/validate.py` enforces.

- `event.schema.json` — the canonical event envelope. Every line in `events.ndjson` must validate against this. The structural markdown files (`patient.md`, `constraints.md`, `timeline/*/encounter_*.md`) have frontmatter that is a subset of the same envelope; their `type` falls in the structural set (`subject`, `encounter`, `constraint_set`) so the conditional `allOf` block does not require `data`/`links`/`encounter_id`/`certainty`. Clinical events (`observation`, `assessment`, `intent`, `action`, `communication`, `artifact_ref`) are required to carry all four.
- `note.schema.json` — frontmatter for narrative notes under `timeline/*/notes/*.md`. A subset of the event envelope plus a required `references` array. Every note ID must have a matching `communication` event in `events.ndjson` pointing to it via `data.note_ref`; the validator enforces **both** directions (note → comm event, comm event → note).
- `constraints.schema.json` — structured constraint block embedded in the YAML frontmatter of `constraints.md`. Optional at author time; once present the validator enforces shape so safety-critical fields (allergies, code status) are queryable without parsing prose.
- `vitals.schema.json` — per-row schema for `vitals.jsonl`. Carries the same provenance shape as events (`source.kind`, `source.ref`, `subject`, `encounter_id`) so monitor samples are addressable via `vitals://` evidence URIs (see `CLAIM-TYPES.md`).

If you add a new `type` or `subtype` convention, update `CLAIM-TYPES.md` first, then add it to `event.schema.json` `type` enum (for closed values) or leave `subtype` open. New clinical types need to be added to the `allOf.if.properties.type.enum` list so the conditional required fields apply.

Do not hand-edit validator output under `_derived/`.
