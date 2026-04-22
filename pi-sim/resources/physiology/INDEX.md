# Physiology Reference Library

Citation-backed reference material for humans and agents reading about physiology. Used to author scenarios, set regression bands, and cross-check Pulse behavior against published literature. Pulse is now the physics engine, so this library is no longer wired into engine code — it is reference documentation.

## Contents

| Section | Purpose | Used by |
|---|---|---|
| [parameters/](parameters/) | Per-vital response time constants, normal ranges, baseline-by-demographic | Scenario authors; reference when sanity-checking Pulse output |
| [coupling/](coupling/) | Reflex map: baroreflex, chemoreflex, Liebermeister, Bainbridge, Cushing, Bezold-Jarisch | Reading aid; Pulse implements these internally |
| [drugs/](drugs/) | PK/PD compendium — onset, duration, dose-response, hemodynamic effects | Scenario authors; reference when choosing infusion rates |
| [scenarios/](scenarios/) | Canonical clinical cases — presentation signature + standard-treatment trajectory | `vitals/scenarios/*.json` timelines + checkpoints |
| [validation-curves/](validation-curves/) | Published reference trajectories used as ground truth | `scripts/validate.ts --mode reference` |

## How to use this library

**As a scenario author:**
1. Read the relevant `scenarios/` or `drugs/` file for canonical numbers.
2. Encode the action timeline in `../../vitals/scenarios/<name>.json`.
3. Set `checkpoints` to the expected Pulse output bands informed by these references.

**As a validator tightening checkpoints:**
1. Pull the trajectory from `validation-curves/` for the scenario.
2. Compare Pulse output to the published curve via `npm run validate -- --mode reference`.
3. Note divergence — those are either Pulse modeling gaps or scenario specification issues.

## Source quality bar

- **Tier 1**: primary literature (PubMed-indexed RCT, cohort study, physiology study). Preferred for numeric parameters.
- **Tier 2**: society guideline (ACC/AHA, Surviving Sepsis, ATLS, ERC, NICE) or major textbook (Tintinalli, Marino's ICU Book, Goodman & Gilman, West's Respiratory Physiology).
- **Tier 3**: UpToDate, Pulse / BioGears engine validation reports.
- **Not acceptable as primary source**: Wikipedia, blog posts, vendor marketing, AI-generated summaries.

Every numeric claim cites at minimum Tier 2.

## Open questions

(Populated as the library grows — flags where consensus literature diverges or where measured data contradicts common clinical teaching. Items here are the highest-priority engine modeling risks.)
