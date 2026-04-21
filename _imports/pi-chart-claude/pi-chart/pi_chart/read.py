"""Read-side tool surface.

Everything here is a query over the canonical chart. No side effects.

Default time semantics: when callers don't supply `as_of`, the read API
uses the latest event's `effective_at` instead of wall-clock now. Otherwise
a 2026-04-18 simulation looks "not recent" simply because real-world time
has advanced since the encounter was authored.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path

import yaml


def _frontmatter_and_body(text: str) -> tuple[dict | None, str]:
    if not text.startswith("---"):
        return None, text
    end = text.find("\n---", 3)
    if end == -1:
        return None, text
    fm = yaml.safe_load(text[3:end].strip())
    body = text[end + 4 :].lstrip("\n")
    return (fm if isinstance(fm, dict) else None), body


def _parse_iso(ts: str) -> datetime | None:
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def latest_effective_at(chart_root: Path | str = ".") -> datetime | None:
    """Walk every events.ndjson + vitals.jsonl and return the max effective_at.

    Used as the default `as_of` for `read_recent_events` so simulations stay
    coherent regardless of wall-clock drift between authoring and reading.
    """
    root = Path(chart_root)
    latest: datetime | None = None
    for events_path in root.glob("timeline/*/events.ndjson"):
        with events_path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                ev = json.loads(line)
                t = _parse_iso(ev.get("effective_at", ""))
                if t and (latest is None or t > latest):
                    latest = t
    for vitals_path in root.glob("timeline/*/vitals.jsonl"):
        with vitals_path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                v = json.loads(line)
                t = _parse_iso(v.get("sampled_at", ""))
                if t and (latest is None or t > latest):
                    latest = t
    return latest


def read_patient_context(chart_root: Path | str = ".") -> dict:
    """Return patient baseline + active constraints + latest encounter header."""
    root = Path(chart_root)
    out: dict = {}
    for name in ("patient.md", "constraints.md"):
        p = root / name
        if p.exists():
            fm, body = _frontmatter_and_body(p.read_text(encoding="utf-8"))
            out[name] = {"frontmatter": fm, "body": body}

    encs = sorted(root.glob("timeline/*/encounter_*.md"))
    if encs:
        latest = encs[-1]
        fm, body = _frontmatter_and_body(latest.read_text(encoding="utf-8"))
        out["encounter"] = {
            "path": str(latest.relative_to(root)),
            "frontmatter": fm,
            "body": body,
        }
    return out


def read_active_constraints(chart_root: Path | str = ".") -> dict:
    """Return both the structured constraint frontmatter and the narrative body.

    Shape: {"structured": <dict from frontmatter.constraints or None>,
            "body": <markdown body>}.
    Agents querying for an allergy can look at `structured.allergies` instead
    of parsing prose; the narrative body remains canonical for anything the
    structured block doesn't capture.
    """
    root = Path(chart_root)
    p = root / "constraints.md"
    if not p.exists():
        return {"structured": None, "body": ""}
    fm, body = _frontmatter_and_body(p.read_text(encoding="utf-8"))
    structured = (fm or {}).get("constraints") if isinstance(fm, dict) else None
    return {"structured": structured, "body": body}


def read_recent_events(
    chart_root: Path | str = ".",
    *,
    within_minutes: int = 120,
    types: list[str] | None = None,
    as_of: datetime | None = None,
) -> list[dict]:
    """Return events within the recent window relative to `as_of`.

    `as_of` defaults to `latest_effective_at(chart_root)` (sim-time semantics)
    to avoid wall-clock drift between authoring and reading. If the chart is
    empty, falls back to the current wall-clock UTC.
    """
    root = Path(chart_root)
    if as_of is None:
        as_of = latest_effective_at(root) or datetime.utcnow()
    cutoff = as_of - timedelta(minutes=within_minutes)
    results: list[dict] = []
    for events_path in sorted(root.glob("timeline/*/events.ndjson")):
        with events_path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                ev = json.loads(line)
                if types and ev.get("type") not in types:
                    continue
                eff_dt = _parse_iso(ev.get("effective_at", ""))
                if eff_dt:
                    # Compare in same naivety as as_of to avoid TypeError.
                    if as_of.tzinfo is None:
                        eff_dt = eff_dt.replace(tzinfo=None)
                    if eff_dt < cutoff:
                        continue
                results.append(ev)
    return results


def read_recent_notes(
    chart_root: Path | str = ".", *, limit: int = 10
) -> list[dict]:
    """Return recent notes with parsed frontmatter and body."""
    root = Path(chart_root)
    notes = sorted(root.glob("timeline/*/notes/*.md"))
    notes = notes[-limit:]
    out: list[dict] = []
    for p in notes:
        fm, body = _frontmatter_and_body(p.read_text(encoding="utf-8"))
        out.append(
            {"path": str(p.relative_to(root)), "frontmatter": fm, "body": body}
        )
    return out


def read_latest_vitals(chart_root: Path | str = ".") -> dict[str, dict]:
    """Return the most recent value for each vital metric.

    Compares parsed timestamps (not raw strings) so trailing precision or
    timezone formatting differences don't break the ordering.
    """
    root = Path(chart_root)
    latest: dict[str, dict] = {}
    for vitals_path in sorted(root.glob("timeline/*/vitals.jsonl")):
        with vitals_path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                v = json.loads(line)
                name = v["name"]
                this_t = _parse_iso(v.get("sampled_at", ""))
                if this_t is None:
                    continue
                if name not in latest:
                    latest[name] = v
                    continue
                prev_t = _parse_iso(latest[name].get("sampled_at", ""))
                if prev_t is None or this_t > prev_t:
                    latest[name] = v
    return latest
