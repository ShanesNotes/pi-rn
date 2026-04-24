# pi-rn

clinical agent system.

## Intent

- `pi-agent/` agent harness
- `pi-chart/` agent-native clinical memory substrate
- `pi-sim/` clinical monitor simulation

## Strategic direction

The durable bet is **clinical memory**: a provenance-rich chart/context
substrate that helps reduce bedside documentation burden and gives a
clinician or agent enough observable context to understand what happened,
why it mattered, what evidence supports it, and what remains uncertain.

The next proof surface is a broad, shallow EHR skeleton, not a full EHR
product and not a narrow polished demo. The first pass must cover:

1. flowsheets / vitals,
2. nursing assessment,
3. notes / narrative charting,
4. orders / medications / interventions,
5. labs / diagnostics,
6. care plan / handoff.

The agent remains under clinical partial observability: pi-sim may own
hidden physiology, but pi-agent and pi-chart see only public clinical
observations such as monitor output, EHR data, assessment findings, and
scenario-rollout artifacts.

See `pi-chart/decisions/016-broad-ehr-skeleton-clinical-memory.md` and
`pi-chart/clinical-reference/broad-ehr-skeleton.md`.

<img width="2102" height="1102" alt="image" src="https://github.com/user-attachments/assets/cda47c4e-a186-4d9e-89d0-2f0dc096d8d1" />





## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](./LICENSE)
for the full text. In short: permissive use/modification/redistribution
with an explicit patent grant and no warranty.
