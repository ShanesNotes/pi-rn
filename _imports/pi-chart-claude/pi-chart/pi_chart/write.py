"""Write-side tool surface.

The only sanctioned way for pi-agent to mutate the chart. Enforces:
  - append-only (never modifies existing events.ndjson lines)
  - provenance required on every write (raises ValueError before append)
  - notes never silently overwrite existing files
  - id generation follows the evt_/note_ convention
  - recorded_at is always set to now at write time

Cross-process ID-counter robustness and immutable-input copying are deferred
to the TypeScript port; the in-memory counter here is sufficient for the
single-agent simulation.
"""

from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml


_id_lock = threading.Lock()
_id_counter: dict[tuple[str, str], int] = {}  # (prefix, YYYYMMDDTHHMM) -> n


# Required envelope fields for every event regardless of type.
_REQUIRED_BASE = ("type", "subject", "effective_at", "author", "source", "status")

# Required additional fields for clinical claim types
# (mirrors schemas/event.schema.json conditional `allOf` block).
_CLINICAL_TYPES = {
    "observation", "assessment", "intent", "action", "communication", "artifact_ref",
}
_REQUIRED_CLINICAL = ("encounter_id", "certainty", "data", "links")


def _now_isoformat() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def _day_dir(chart_root: Path, effective_at: str) -> Path:
    day = effective_at[:10]  # YYYY-MM-DD
    d = chart_root / "timeline" / day
    d.mkdir(parents=True, exist_ok=True)
    return d


def _check_provenance(event: dict) -> None:
    missing = [k for k in _REQUIRED_BASE if k not in event]
    if missing:
        raise ValueError(f"event missing required envelope fields: {missing}")
    if event.get("type") in _CLINICAL_TYPES:
        clinical_missing = [k for k in _REQUIRED_CLINICAL if k not in event]
        if clinical_missing:
            raise ValueError(
                f"clinical event ({event['type']}) missing required fields: {clinical_missing}"
            )


def next_event_id(effective_at: str | None = None) -> str:
    """Generate the next event id for a given effective-at timestamp.

    Format: evt_YYYYMMDDTHHMM_NN, where NN auto-increments within the minute.
    Not persistent across processes; the TS port replaces this with a
    file-probe pattern that survives restarts.
    """
    eff = effective_at or _now_isoformat()
    ymd_hm = eff.replace("-", "").replace(":", "")[:13]  # YYYYMMDDTHHMM
    key = ("evt", ymd_hm)
    with _id_lock:
        n = _id_counter.get(key, 0) + 1
        _id_counter[key] = n
    return f"evt_{ymd_hm}_{n:02d}"


def next_note_id(effective_at: str | None = None, slug: str | None = None) -> str:
    eff = effective_at or _now_isoformat()
    ymd_hm = eff.replace("-", "").replace(":", "")[:13]
    return f"note_{ymd_hm}" + (f"_{slug}" if slug else "")


def append_event(
    event: dict,
    *,
    chart_root: Path | str = ".",
) -> str:
    """Append a single event to the appropriate day's events.ndjson.

    Raises ValueError if required provenance fields are missing. Fills in
    `recorded_at` and `id` if absent. Returns the event id. Schema-level
    validation (e.g. enum membership) happens in `validate_chart` after a
    decision-cycle commits — this check is the cheaper, write-time guard.
    """
    _check_provenance(event)
    if "recorded_at" not in event:
        event["recorded_at"] = _now_isoformat()
    if "id" not in event:
        event["id"] = next_event_id(event.get("effective_at"))

    root = Path(chart_root)
    eff = event.get("effective_at") or event["recorded_at"]
    day = _day_dir(root, eff)
    events_path = day / "events.ndjson"
    with events_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(event, separators=(",", ":")) + "\n")
    return event["id"]


def write_note(
    *,
    frontmatter: dict,
    body: str,
    chart_root: Path | str = ".",
    slug: str | None = None,
) -> Path:
    """Write a narrative note under timeline/YYYY-MM-DD/notes/HHMM_<slug>.md.

    Raises FileExistsError if the target path already exists — the chart is
    append-oriented and corrections are new notes that link `supersedes`,
    never overwrites. Fills in `recorded_at` and `id` if missing. Returns
    the written path.

    Caller is responsible for also appending a matching `communication` event
    in events.ndjson, OR (recommended) using `write_communication_note` which
    does both atomically.
    """
    root = Path(chart_root)
    fm = dict(frontmatter)
    if "recorded_at" not in fm:
        fm["recorded_at"] = _now_isoformat()
    eff = fm.get("effective_at") or fm["recorded_at"]
    if "id" not in fm:
        fm["id"] = next_note_id(eff, slug=slug)
    if "references" not in fm:
        fm["references"] = []

    day = _day_dir(root, eff)
    notes_dir = day / "notes"
    notes_dir.mkdir(exist_ok=True)
    hhmm = eff[11:16].replace(":", "")
    filename_slug = slug or fm["id"].split("_")[-1]
    filename = f"{hhmm}_{filename_slug}.md"
    path = notes_dir / filename

    if path.exists():
        raise FileExistsError(
            f"note already exists at {path} — chart is append-only; "
            f"write a new note that links supersedes/corrects to the prior id"
        )

    fm_yaml = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True).strip()
    text = f"---\n{fm_yaml}\n---\n\n{body.strip()}\n"
    path.write_text(text, encoding="utf-8")
    return path


def write_communication_note(
    *,
    frontmatter: dict,
    body: str,
    communication_data: dict | None = None,
    chart_root: Path | str = ".",
    slug: str | None = None,
) -> tuple[Path, str]:
    """Write a note file AND append the matching communication event.

    Recommended over calling `write_note` + `append_event` separately because
    the inverse note ↔ communication link is easy to forget; the validator
    requires both directions.

    The communication event is constructed by mirroring the note's envelope
    (subject, encounter_id, effective_at, author, source, status) and setting
    `data.note_ref` to the note id. Pass extra communication-specific fields
    (audience, summary, subtype, ...) via `communication_data`.

    Returns (note_path, communication_event_id).
    """
    note_path = write_note(
        frontmatter=frontmatter,
        body=body,
        chart_root=chart_root,
        slug=slug,
    )
    fm = yaml.safe_load(note_path.read_text(encoding="utf-8").split("---", 2)[1])
    comm = {
        "type": "communication",
        "subtype": fm.get("subtype", "progress_note"),
        "subject": fm["subject"],
        "encounter_id": fm["encounter_id"],
        "effective_at": fm["effective_at"],
        "author": fm["author"],
        "source": fm["source"],
        "certainty": "performed",
        "status": fm.get("status", "final"),
        "data": {"note_ref": fm["id"], **(communication_data or {})},
        "links": {"supports": list(fm.get("references") or []), "supersedes": []},
    }
    event_id = append_event(comm, chart_root=chart_root)
    return note_path, event_id


def write_artifact_ref(
    *,
    artifact_path: Path | str,
    kind: str,
    description: str,
    encounter_id: str,
    subject: str,
    effective_at: str | None = None,
    chart_root: Path | str = ".",
    author: dict | None = None,
) -> str:
    """Register a binary artifact (image, PDF, waveform) as an artifact_ref event.

    The file itself should already live under `artifacts/`. This creates the
    pointer event in events.ndjson and returns the event id.
    """
    event = {
        "type": "artifact_ref",
        "subtype": kind,
        "subject": subject,
        "encounter_id": encounter_id,
        "effective_at": effective_at or _now_isoformat(),
        "author": author or {"id": "pi-agent", "role": "rn_agent"},
        "source": {"kind": "artifact_ingest"},
        "certainty": "observed",
        "status": "final",
        "data": {
            "kind": kind,
            "path": str(artifact_path),
            "description": description,
        },
        "links": {"supports": [], "supersedes": []},
    }
    return append_event(event, chart_root=chart_root)
