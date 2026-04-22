# Validation Trajectories

Real, published, citable patient trajectories used as ground truth for `npm run validate` checkpoints. The point is to break the circularity of "engine passes tests written from engine output."

**Engine site:** scenario `checkpoints[].expect` ranges in `vitals/scenarios/*.json`.

## Sources to evaluate

| Dataset | Access | Cohorts of interest |
|---|---|---|
| MIMIC-III / MIMIC-IV | PhysioNet credentialed | sepsis, hemorrhage, post-arrest, intubation |
| eICU Collaborative Research DB | PhysioNet credentialed | multicenter ICU vitals |
| HiRID | credentialed | high-resolution Bern ICU |
| AmsterdamUMCdb | credentialed | high-resolution Dutch ICU |
| Pulse Physiology Engine validation reports | open | their published validation curves per scenario |
| BioGears validation studies | open | older sibling of Pulse |
| Published case series | varies | textbook trajectories |

## File format per curve

```markdown
# <curve name>

**Scenario:** <link to scenarios/<file>.md>
**Source:** <dataset / paper>
**Cohort:** <inclusion criteria>
**N:** <patients aggregated>

## Trajectory (median or representative)

| t (min) | HR | MAP | BP_sys | BP_dia | RR | SpO2 | Temp |
|---|---|---|---|---|---|---|---|

## Intervention timing

- t = <X>: <intervention>

## Variability

<spread / IQR notes>

## Citation

<full reference + DOI/URL>
```

## Curves to acquire

- sepsis-norepi-mimic.md  (MIMIC septic patients receiving norepi within 24h)
- hemorrhage-class-iii-trauma.md  (trauma cohort with documented Class III shock + crystalloid)
- post-intubation-vitals.md  (response to RSI)
- pulse-engine-sepsis-validation.md  (extract from Pulse's own validation report)
- pulse-engine-hemorrhage-validation.md
- bolus-response-healthy.md  (BP rise per liter of crystalloid in non-hypovolemic patients)

## Open questions

- Whether MIMIC sampling rate (often hourly chart values, not bedside-rate) is dense enough for sub-hour validation
- Whether to extract waveform-rate data from MIMIC-III Waveform Database for select cases
- IRB / data-use considerations for storing extracted trajectories in this repo (likely fine — already de-identified, but document)
