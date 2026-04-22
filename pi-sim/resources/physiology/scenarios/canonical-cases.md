# Canonical Clinical Scenarios

For each scenario: presenting vitals signature, expected trajectory under no treatment, expected trajectory under standard treatment, key inflection points. These become the source for `vitals/scenarios/*.json` checkpoints.

**Engine site:** `vitals/scenarios/*.json` (presentation matches `conditions[].severity`; trajectory matches `checkpoints[].expect`).

## File template per scenario

```markdown
# <scenario>

## Presenting vitals (untreated)

- HR: <range>  | BP: <sys/dia range>  | RR: <range>  | SpO2: <range>  | Temp: <range>

## Trajectory — no treatment

| t (min) | HR | BP | RR | SpO2 | Temp | Notes |
|---|---|---|---|---|---|---|

## Trajectory — standard treatment

(per guideline, with intervention timing)

## Key inflection points

- <inflection>: <what changes physiologically>

## Engine mapping

- Conditions to combine: <list>
- Severity progression: <how it should evolve>
- Interventions to wire: <list>

## Sources

1. <guideline / textbook / paper>
```

## Scenarios to populate

- hemorrhagic-shock-class-i-iv.md  (ATLS)
- septic-shock.md  (Surviving Sepsis 2021)
- anaphylaxis.md  (WAO guidelines)
- stemi-presentation.md
- massive-pe.md
- tension-pneumothorax.md
- cardiac-tamponade.md
- dka.md
- opioid-overdose.md
- hypoglycemia.md
- acute-stroke-lvo.md
- status-asthmaticus.md
- decompensated-chf.md
- hypothermia-stages.md

## Open questions

(populated per scenario)
