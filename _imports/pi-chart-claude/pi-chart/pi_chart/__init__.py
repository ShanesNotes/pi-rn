"""
pi_chart — the tool surface pi-agent uses to read and write the chart.

The backing store is just a filesystem, but the agent goes through these
functions rather than arbitrary file I/O. This gives us:
  - a testable API
  - a single chokepoint for provenance and append-only discipline
  - a clean place to swap in SQLite/vector indexes later without touching agents

All functions take a `chart_root: Path` (defaults to cwd). Per the v0.1
write-boundary contract, `append_event` and `write_note` raise on contract
violations (missing provenance, note overwrite) — invalid writes are
impossible, not merely detectable later.
"""

from .read import (
    read_patient_context,
    read_active_constraints,
    read_recent_events,
    read_recent_notes,
    read_latest_vitals,
    latest_effective_at,
)
from .write import (
    append_event,
    write_note,
    write_communication_note,
    write_artifact_ref,
    next_event_id,
    next_note_id,
)
from .derived import rebuild_derived
from .validate import validate_chart

__all__ = [
    "read_patient_context",
    "read_active_constraints",
    "read_recent_events",
    "read_recent_notes",
    "read_latest_vitals",
    "latest_effective_at",
    "append_event",
    "write_note",
    "write_communication_note",
    "write_artifact_ref",
    "next_event_id",
    "next_note_id",
    "rebuild_derived",
    "validate_chart",
]

__version__ = "0.1.0"
