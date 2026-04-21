#!/usr/bin/env python3
"""
pi-chart validator.

The first tool. Runs before any growth into SQLite, FHIR, or vector stores.

Enforces (v0.1):
  - event envelope schema (schemas/event.schema.json) with conditional
    required-fields per type group (clinical vs structural)
  - note frontmatter schema (schemas/note.schema.json) including the
    required `references` array
  - structured constraint frontmatter (schemas/constraints.schema.json) when
    `constraints.md` carries a `constraints:` block
  - vitals row schema (schemas/vitals.schema.json) for every line in
    `timeline/*/vitals.jsonl`
  - referential integrity for links.supports / supersedes / corrects, including
    interval evidence URIs of the form
    `vitals://<encounter_id>?name=<metric>&from=<iso8601>&to=<iso8601>`
  - bidirectional note ↔ communication: every note has a communication event,
    every communication event's note_ref resolves
  - note.references[] resolution
  - subject-match against chart.yaml
  - day-directory prefix sanity (warning)
  - assessment evidence rule: links.supports must include at least one
    observation event, vitals:// URI, or artifact_ref event
  - five invariants from README.md (machine-checkable subset)

Usage:
    python scripts/validate.py [path/to/pi-chart]

Exits non-zero on any error. Warnings do not fail validation.

Dependencies: jsonschema, pyyaml. See scripts/requirements.txt.
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Iterator
from urllib.parse import urlparse, parse_qs

try:
    import yaml
    from jsonschema import Draft202012Validator
except ImportError:
    print(
        "Missing dependencies. Install with:\n"
        "    pip install -r scripts/requirements.txt",
        file=sys.stderr,
    )
    sys.exit(2)


CLINICAL_TYPES = {
    "observation", "assessment", "intent", "action", "communication", "artifact_ref",
}
STRUCTURAL_TYPES = {"subject", "encounter", "constraint_set"}


@dataclass
class Report:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def error(self, where: str, msg: str) -> None:
        self.errors.append(f"ERROR  {where}: {msg}")

    def warn(self, where: str, msg: str) -> None:
        self.warnings.append(f"WARN   {where}: {msg}")

    def merge(self, other: "Report") -> None:
        self.errors.extend(other.errors)
        self.warnings.extend(other.warnings)

    def print(self) -> None:
        for w in self.warnings:
            print(w)
        for e in self.errors:
            print(e)
        print()
        print(f"{len(self.errors)} error(s), {len(self.warnings)} warning(s)")

    @property
    def ok(self) -> bool:
        return not self.errors


def parse_frontmatter(text: str) -> tuple[dict | None, str]:
    """Split a markdown file into (frontmatter_dict, body_text)."""
    if not text.startswith("---"):
        return None, text
    end = text.find("\n---", 3)
    if end == -1:
        return None, text
    fm_text = text[3:end].strip()
    body = text[end + 4 :].lstrip("\n")
    try:
        data = yaml.safe_load(fm_text)
    except yaml.YAMLError as e:
        raise ValueError(f"invalid YAML frontmatter: {e}") from e
    if not isinstance(data, dict):
        raise ValueError("frontmatter is not a YAML mapping")
    return _normalize(data), body


def _normalize(obj):
    """Convert YAML-parsed datetime/date to ISO strings.

    YAML natively parses ISO 8601 timestamps into datetime objects, but our
    JSON Schema treats them as strings. Normalize on the way in.
    """
    from datetime import date, datetime as _dt
    if isinstance(obj, dict):
        return {k: _normalize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_normalize(v) for v in obj]
    if isinstance(obj, _dt):
        return obj.isoformat(timespec="seconds")
    if isinstance(obj, date):
        return obj.isoformat()
    return obj


def iter_ndjson(path: Path) -> Iterator[tuple[int, dict]]:
    with path.open("r", encoding="utf-8") as f:
        for lineno, line in enumerate(f, start=1):
            stripped = line.strip()
            if not stripped:
                continue
            yield lineno, json.loads(line)


def load_schema(path: Path) -> Draft202012Validator:
    with path.open("r", encoding="utf-8") as f:
        schema = json.load(f)
    return Draft202012Validator(schema)


def _parse_iso(ts: str) -> datetime | None:
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except (ValueError, TypeError, AttributeError):
        return None


# ---------------------------------------------------------------------------
# Vitals interval evidence URI: vitals://<enc>?name=...&from=...&to=...
# ---------------------------------------------------------------------------

@dataclass
class VitalsEvidence:
    encounter_id: str
    name: str
    from_dt: datetime
    to_dt: datetime
    unit: str | None = None


def parse_vitals_uri(uri: str) -> VitalsEvidence | None:
    if not uri.startswith("vitals://"):
        return None
    parsed = urlparse(uri)
    if parsed.scheme != "vitals":
        return None
    # urlparse stuffs the encounter id into netloc.
    encounter_id = parsed.netloc
    qs = parse_qs(parsed.query)
    name = (qs.get("name") or [None])[0]
    frm = (qs.get("from") or [None])[0]
    to = (qs.get("to") or [None])[0]
    unit = (qs.get("unit") or [None])[0]
    frm_dt = _parse_iso(frm) if frm else None
    to_dt = _parse_iso(to) if to else None
    if not (encounter_id and name and frm_dt and to_dt):
        return None
    return VitalsEvidence(encounter_id, name, frm_dt, to_dt, unit)


def _vitals_window_has_samples(
    chart_root: Path, evidence: VitalsEvidence
) -> bool:
    for vitals_path in chart_root.glob("timeline/*/vitals.jsonl"):
        for _, v in iter_ndjson(vitals_path):
            if v.get("encounter_id") != evidence.encounter_id:
                continue
            if v.get("name") != evidence.name:
                continue
            t = _parse_iso(v.get("sampled_at", ""))
            if not t:
                continue
            if evidence.from_dt <= t <= evidence.to_dt:
                return True
    return False


# ---------------------------------------------------------------------------
# Top-level walk
# ---------------------------------------------------------------------------

def validate_chart(chart_root: Path) -> Report:
    report = Report()

    # --- load schemas ---
    event_schema_path = chart_root / "schemas" / "event.schema.json"
    note_schema_path = chart_root / "schemas" / "note.schema.json"
    constraints_schema_path = chart_root / "schemas" / "constraints.schema.json"
    vitals_schema_path = chart_root / "schemas" / "vitals.schema.json"
    if not event_schema_path.exists():
        report.error("schemas", f"missing {event_schema_path}")
        return report
    event_validator = load_schema(event_schema_path)
    note_validator = (
        load_schema(note_schema_path) if note_schema_path.exists() else None
    )
    constraints_validator = (
        load_schema(constraints_schema_path) if constraints_schema_path.exists() else None
    )
    vitals_validator = (
        load_schema(vitals_schema_path) if vitals_schema_path.exists() else None
    )

    # --- load chart.yaml for subject-match ---
    expected_subject = _expected_subject(chart_root, report)

    all_ids: dict[str, str] = {}                # id -> where first seen
    note_ids: set[str] = set()                  # all note ids
    communication_note_refs: set[str] = set()   # note_refs cited by comm events
    event_types: dict[str, str] = {}            # id -> type (for assessment evidence rule)

    # --- structural markdown files ---
    for name in ("patient.md", "constraints.md"):
        p = chart_root / name
        if not p.exists():
            report.error(name, "missing")
            continue
        _validate_markdown_frontmatter(
            p, chart_root, event_validator, all_ids, report,
            expected_subject=expected_subject,
        )

    # --- constraints.md structured block ---
    if constraints_validator is not None:
        _validate_constraints_block(
            chart_root / "constraints.md", chart_root, constraints_validator, report
        )

    # --- walk timeline/ ---
    timeline_root = chart_root / "timeline"
    if not timeline_root.is_dir():
        report.warn("timeline/", "no timeline directory yet")
    else:
        for day_dir in sorted(p for p in timeline_root.iterdir() if p.is_dir()):
            _validate_day(
                day_dir, chart_root,
                event_validator, note_validator, vitals_validator,
                all_ids, note_ids, communication_note_refs, event_types,
                report, expected_subject,
            )

    # --- referential integrity (forward refs allowed within day) ---
    _check_referential_integrity(
        chart_root, all_ids, note_ids, event_types, report
    )

    # --- bidirectional note ↔ communication ---
    _check_note_communication_pairing(
        note_ids, communication_note_refs, report
    )

    # --- invariant: derived files not hand-edited ---
    _check_derived_not_edited(chart_root, report)

    return report


# ---------------------------------------------------------------------------
# Per-file/section helpers
# ---------------------------------------------------------------------------

def _expected_subject(chart_root: Path, report: Report) -> str | None:
    p = chart_root / "chart.yaml"
    if not p.exists():
        report.warn("chart.yaml", "missing — subject-match check skipped")
        return None
    try:
        data = yaml.safe_load(p.read_text(encoding="utf-8"))
    except yaml.YAMLError as e:
        report.error("chart.yaml", f"invalid YAML: {e}")
        return None
    subj = (data or {}).get("subject")
    if not isinstance(subj, str):
        report.error("chart.yaml", "missing or non-string 'subject'")
        return None
    return subj


def _validate_markdown_frontmatter(
    path: Path,
    chart_root: Path,
    validator: Draft202012Validator,
    all_ids: dict[str, str],
    report: Report,
    *,
    expected_subject: str | None = None,
) -> None:
    rel = path.relative_to(chart_root)
    try:
        text = path.read_text(encoding="utf-8")
        fm, _ = parse_frontmatter(text)
    except (ValueError, OSError) as e:
        report.error(str(rel), str(e))
        return
    if fm is None:
        report.error(str(rel), "no frontmatter block (expected leading ---)")
        return

    for err in sorted(validator.iter_errors(fm), key=lambda e: list(e.path)):
        loc = "/".join(str(p) for p in err.absolute_path) or "(root)"
        report.error(str(rel), f"{loc}: {err.message}")

    if expected_subject and fm.get("subject") not in (None, expected_subject):
        report.error(
            str(rel),
            f"subject '{fm.get('subject')}' does not match chart.yaml subject '{expected_subject}'",
        )

    evid = fm.get("id")
    if isinstance(evid, str):
        if evid in all_ids:
            report.error(
                str(rel),
                f"duplicate id '{evid}' (first seen at {all_ids[evid]})",
            )
        else:
            all_ids[evid] = str(rel)


def _validate_constraints_block(
    path: Path,
    chart_root: Path,
    validator: Draft202012Validator,
    report: Report,
) -> None:
    if not path.exists():
        return
    try:
        fm, _ = parse_frontmatter(path.read_text(encoding="utf-8"))
    except ValueError:
        return  # frontmatter error already reported elsewhere
    if not fm:
        return
    block = fm.get("constraints")
    if block is None:
        return  # no structured block authored yet — fine
    rel = path.relative_to(chart_root)
    for err in sorted(validator.iter_errors(block), key=lambda e: list(e.path)):
        loc = "constraints/" + ("/".join(str(p) for p in err.absolute_path) or "(root)")
        report.error(str(rel), f"{loc}: {err.message}")


def _validate_day(
    day_dir: Path,
    chart_root: Path,
    event_validator: Draft202012Validator,
    note_validator: Draft202012Validator | None,
    vitals_validator: Draft202012Validator | None,
    all_ids: dict[str, str],
    note_ids: set[str],
    communication_note_refs: set[str],
    event_types: dict[str, str],
    report: Report,
    expected_subject: str | None,
) -> None:
    day_prefix = day_dir.name  # e.g. "2026-04-18"

    # encounter headers
    for enc_path in sorted(day_dir.glob("encounter_*.md")):
        _validate_markdown_frontmatter(
            enc_path, chart_root, event_validator, all_ids, report,
            expected_subject=expected_subject,
        )

    # events.ndjson
    events_path = day_dir / "events.ndjson"
    if events_path.exists():
        try:
            for lineno, ev in iter_ndjson(events_path):
                where = f"{events_path.relative_to(chart_root)}:{lineno}"
                for err in sorted(event_validator.iter_errors(ev), key=lambda e: list(e.path)):
                    loc = "/".join(str(p) for p in err.absolute_path) or "(root)"
                    report.error(where, f"{loc}: {err.message}")

                evid = ev.get("id")
                if isinstance(evid, str):
                    if evid in all_ids:
                        report.error(
                            where,
                            f"duplicate id '{evid}' (first seen at {all_ids[evid]})",
                        )
                    else:
                        all_ids[evid] = where
                    if isinstance(ev.get("type"), str):
                        event_types[evid] = ev["type"]

                if expected_subject and ev.get("subject") not in (None, expected_subject):
                    report.error(
                        where,
                        f"subject '{ev.get('subject')}' does not match chart.yaml subject '{expected_subject}'",
                    )

                eff = ev.get("effective_at")
                if isinstance(eff, str) and not eff.startswith(day_prefix):
                    report.warn(
                        where,
                        f"effective_at '{eff}' does not start with day directory prefix '{day_prefix}'",
                    )

                # collect note_refs from communication events
                if ev.get("type") == "communication":
                    note_ref = (ev.get("data") or {}).get("note_ref")
                    if isinstance(note_ref, str):
                        communication_note_refs.add(note_ref)
        except json.JSONDecodeError as e:
            report.error(str(events_path.relative_to(chart_root)), f"invalid JSON: {e}")

    # vitals.jsonl
    vitals_path = day_dir / "vitals.jsonl"
    if vitals_path.exists():
        try:
            for lineno, v in iter_ndjson(vitals_path):
                where = f"{vitals_path.relative_to(chart_root)}:{lineno}"
                if vitals_validator is not None:
                    for err in sorted(vitals_validator.iter_errors(v), key=lambda e: list(e.path)):
                        loc = "/".join(str(p) for p in err.absolute_path) or "(root)"
                        report.error(where, f"{loc}: {err.message}")
                if expected_subject and v.get("subject") not in (None, expected_subject):
                    report.error(
                        where,
                        f"subject '{v.get('subject')}' does not match chart.yaml subject '{expected_subject}'",
                    )
                sampled_at = v.get("sampled_at")
                if isinstance(sampled_at, str) and not sampled_at.startswith(day_prefix):
                    report.warn(
                        where,
                        f"sampled_at '{sampled_at}' does not start with day directory prefix '{day_prefix}'",
                    )
        except json.JSONDecodeError as e:
            report.error(str(vitals_path.relative_to(chart_root)), f"invalid JSON: {e}")

    # notes
    notes_dir = day_dir / "notes"
    if notes_dir.is_dir() and note_validator is not None:
        for note_path in sorted(notes_dir.glob("*.md")):
            _validate_note(
                note_path, chart_root, note_validator, all_ids, note_ids,
                report, expected_subject,
            )


def _validate_note(
    path: Path,
    chart_root: Path,
    validator: Draft202012Validator,
    all_ids: dict[str, str],
    note_ids: set[str],
    report: Report,
    expected_subject: str | None,
) -> None:
    rel = path.relative_to(chart_root)
    try:
        text = path.read_text(encoding="utf-8")
        fm, body = parse_frontmatter(text)
    except (ValueError, OSError) as e:
        report.error(str(rel), str(e))
        return
    if fm is None:
        report.error(str(rel), "no frontmatter block")
        return

    for err in sorted(validator.iter_errors(fm), key=lambda e: list(e.path)):
        loc = "/".join(str(p) for p in err.absolute_path) or "(root)"
        report.error(str(rel), f"{loc}: {err.message}")

    if expected_subject and fm.get("subject") not in (None, expected_subject):
        report.error(
            str(rel),
            f"subject '{fm.get('subject')}' does not match chart.yaml subject '{expected_subject}'",
        )

    if not body.strip():
        report.warn(str(rel), "note body is empty")

    nid = fm.get("id")
    if isinstance(nid, str):
        if nid in all_ids:
            report.error(
                str(rel),
                f"duplicate id '{nid}' (first seen at {all_ids[nid]})",
            )
        else:
            all_ids[nid] = str(rel)
        note_ids.add(nid)


# ---------------------------------------------------------------------------
# Cross-file checks
# ---------------------------------------------------------------------------

def _check_referential_integrity(
    chart_root: Path,
    all_ids: dict[str, str],
    note_ids: set[str],
    event_types: dict[str, str],
    report: Report,
) -> None:
    """Walk events + notes again and verify every link target exists.

    Also enforces the assessment-evidence rule: an assessment's links.supports
    must include at least one observation event, vitals:// URI, or
    artifact_ref event.
    """
    # events
    for events_path in chart_root.glob("timeline/*/events.ndjson"):
        try:
            for lineno, ev in iter_ndjson(events_path):
                where = f"{events_path.relative_to(chart_root)}:{lineno}"
                links = ev.get("links") or {}
                supports = links.get("supports") or []
                _check_link_targets(
                    where, "supports", supports,
                    chart_root, all_ids, report,
                )
                for fname in ("supersedes", "corrects"):
                    for target in links.get(fname, []) or []:
                        if target not in all_ids:
                            report.error(
                                where,
                                f"links.{fname}: unknown target id '{target}'",
                            )

                if ev.get("type") == "communication":
                    note_ref = (ev.get("data") or {}).get("note_ref")
                    if note_ref and note_ref not in note_ids:
                        report.error(
                            where,
                            f"data.note_ref: unknown note id '{note_ref}'",
                        )

                if ev.get("type") == "assessment":
                    if not _has_observation_evidence(supports, event_types):
                        report.error(
                            where,
                            "assessment links.supports must include at least one "
                            "observation event, vitals:// URI, or artifact_ref event",
                        )
        except json.JSONDecodeError:
            pass  # already reported

    # notes
    for note_path in chart_root.glob("timeline/*/notes/*.md"):
        try:
            fm, _ = parse_frontmatter(note_path.read_text(encoding="utf-8"))
        except ValueError:
            continue
        if not fm:
            continue
        rel = str(note_path.relative_to(chart_root))
        for ref in fm.get("references", []) or []:
            if isinstance(ref, str) and ref not in all_ids:
                report.error(
                    rel, f"references: unknown id '{ref}'"
                )


def _check_link_targets(
    where: str,
    field_name: str,
    items: list,
    chart_root: Path,
    all_ids: dict[str, str],
    report: Report,
) -> None:
    for target in items:
        if not isinstance(target, str):
            report.error(where, f"links.{field_name}: non-string target")
            continue
        if target.startswith("vitals://"):
            evidence = parse_vitals_uri(target)
            if evidence is None:
                report.error(
                    where,
                    f"links.{field_name}: malformed vitals URI '{target}'",
                )
                continue
            if not _vitals_window_has_samples(chart_root, evidence):
                report.error(
                    where,
                    f"links.{field_name}: vitals URI '{target}' matches no samples",
                )
            continue
        if target not in all_ids:
            report.error(
                where, f"links.{field_name}: unknown target id '{target}'"
            )


def _has_observation_evidence(
    supports: list, event_types: dict[str, str]
) -> bool:
    for s in supports:
        if not isinstance(s, str):
            continue
        if s.startswith("vitals://"):
            return True
        et = event_types.get(s)
        if et in ("observation", "artifact_ref"):
            return True
    return False


def _check_note_communication_pairing(
    note_ids: set[str],
    communication_note_refs: set[str],
    report: Report,
) -> None:
    """Every note must be cited by a communication event (note → comm)."""
    for nid in sorted(note_ids):
        if nid not in communication_note_refs:
            report.error(
                "notes",
                f"note '{nid}' has no matching communication event "
                f"(no events.ndjson row with data.note_ref == '{nid}')",
            )


def _check_derived_not_edited(chart_root: Path, report: Report) -> None:
    """Warn if _derived/ contains files that look hand-edited."""
    derived = chart_root / "_derived"
    if not derived.is_dir():
        return
    for f in derived.rglob("*"):
        if not f.is_file():
            continue
        if f.name == "README.md":
            continue
        text = f.read_text(encoding="utf-8", errors="ignore")
        if "generated by" not in text.lower():
            report.warn(
                str(f.relative_to(chart_root)),
                "derived file is missing 'generated by' marker; may have been hand-edited",
            )


def main(argv: list[str]) -> int:
    chart_root = Path(argv[1] if len(argv) > 1 else ".").resolve()
    if not chart_root.is_dir():
        print(f"not a directory: {chart_root}", file=sys.stderr)
        return 2
    print(f"validating {chart_root}")
    report = validate_chart(chart_root)
    report.print()
    return 0 if report.ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
