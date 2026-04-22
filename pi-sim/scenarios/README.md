# scenarios/

Reproducible starting states. Each scenario is a directory containing the `chart/` and `vitals/` the sim should begin with. Empty by default — author a scenario when you want to replay the same starting point across runs.

Conventional shape:

```
scenarios/<name>/
  chart/      copied into repo-root chart/ on seed
  vitals/     copied into repo-root vitals/ on seed
```
