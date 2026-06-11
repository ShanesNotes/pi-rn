# Validation and pi-agent assist boundary

Status: readiness memo
Parent: `.scratch/observable-charting-adapter-readiness/PRD.md`

## Human validation authority

Only explicit clinician/user action may promote draft observations to validated chart truth.

## pi-agent permitted assist

- Summarize draft batches and gaps
- Flag outliers and missing samples
- Match drafts to orders or care items
- Prepare review bundles for human decision

## pi-agent forbidden actions

- Silent validation or attestation
- Override clinician corrections
- Infer future vitals or latent physiology
- Import hidden `pi-sim` source, providers, or validation-only evidence
- Write chart truth directly

## Boundary with clinical-truth service

Agent suggestions and draft staging remain chart/runtime concerns upstream of kernel append admission. Accepted clinical writes reach the ledger only through human-sanctioned paths per the accepted clinical-truth-service north star.