# Scripts

Runnable utilities that operate on the chart filesystem directly.

## `validate.py`

The first tool. Per C's council feedback, before FHIR, SQLite, or vector
memory comes a validator.

```bash
pip install -r scripts/requirements.txt
python scripts/validate.py .
```

Exits non-zero on error. Warnings are printed but don't fail.

## `rebuild_derived.py`

Regenerates the disposable views in `_derived/` from canonical sources.
Safe to run at any time. Safe to delete `_derived/*.md` between runs.

```bash
python scripts/rebuild_derived.py .
```

## Philosophy

These scripts do the bare minimum to make the filesystem-as-chart model
work. Anything more sophisticated — querying, summarizing, retrieval —
belongs in the `pi_chart/` Python package where it can be unit-tested
and imported by the agent.
