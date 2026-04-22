from __future__ import annotations

import json
from pathlib import Path
import warnings

from monitor_ui.config import MonitorConfig
from monitor_ui.models import VitalFrame
from monitor_ui.vitals_source import VitalsSource

FIXTURES = Path(__file__).resolve().parent / 'fixtures'


def make_config(tmp_path: Path) -> MonitorConfig:
    return MonitorConfig(
        repo_root=tmp_path,
        vitals_dir=tmp_path,
        bed_label='Test Bed',
        fullscreen=False,
        poll_interval_ms=250,
    )


def write_fixture(tmp_path: Path, name: str, target: str) -> None:
    source = FIXTURES / name
    Path(tmp_path / target).write_text(source.read_text(), encoding='utf-8')


def test_load_snapshot_parses_current_timeline_and_thresholds(tmp_path: Path) -> None:
    write_fixture(tmp_path, 'current_nominal.json', 'current.json')
    write_fixture(tmp_path, 'timeline_sample.json', 'timeline.json')
    write_fixture(tmp_path, 'alarms.json', 'alarms.json')

    source = VitalsSource(make_config(tmp_path))
    snapshot = source._load_snapshot()

    assert snapshot.has_data is True
    assert snapshot.frame is not None
    assert snapshot.frame.hr == 72.011428
    assert snapshot.frame.alarms == []
    assert len(snapshot.timeline) == 3
    assert snapshot.thresholds['hr'] == {'low': 50, 'high': 120}
    assert snapshot.alarm_fields == set()
    assert snapshot.status_text == 'live data'
    assert snapshot.last_error is None


def test_load_snapshot_tolerates_missing_empty_and_malformed_json(tmp_path: Path) -> None:
    Path(tmp_path / 'current.json').write_text('', encoding='utf-8')
    Path(tmp_path / 'timeline.json').write_text('{not valid json', encoding='utf-8')

    source = VitalsSource(make_config(tmp_path))
    snapshot = source._load_snapshot()

    assert snapshot.has_data is False
    assert snapshot.frame is None
    assert snapshot.timeline == []
    assert snapshot.thresholds == {}
    assert snapshot.status_text == 'waiting for data…'


def test_refresh_emits_once_for_duplicate_snapshot(tmp_path: Path) -> None:
    write_fixture(tmp_path, 'current_alarming.json', 'current.json')
    write_fixture(tmp_path, 'timeline_sample.json', 'timeline.json')
    write_fixture(tmp_path, 'alarms.json', 'alarms.json')

    source = VitalsSource(make_config(tmp_path))
    snapshots: list[object] = []
    source.snapshot_changed.connect(snapshots.append)

    source.refresh()
    source.refresh()

    assert len(snapshots) == 1


def test_unknown_fields_go_to_extra_fields_and_warn_once(tmp_path: Path) -> None:
    VitalFrame._warned_extra_fields.clear()
    write_fixture(tmp_path, 'current_unknown_field.json', 'current.json')
    write_fixture(tmp_path, 'timeline_sample.json', 'timeline.json')
    write_fixture(tmp_path, 'alarms.json', 'alarms.json')

    source = VitalsSource(make_config(tmp_path))

    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        first = source._load_snapshot()
        second = source._load_snapshot()

    assert first.frame is not None
    assert first.frame.extra_fields == {'new_metric': 123.45}
    assert second.frame is not None
    assert second.frame.extra_fields == {'new_metric': 123.45}
    runtime_warnings = [item for item in caught if item.category is RuntimeWarning]
    assert len(runtime_warnings) == 1
    assert 'new_metric' in str(runtime_warnings[0].message)


def test_alarm_mapping_normalizes_suffixes_and_nbp_prefix(tmp_path: Path) -> None:
    source = VitalsSource(make_config(tmp_path))
    mapped = source._alarm_fields(['HR_HIGH', 'nbp_sys_low', 'spo2_warn', 'unknown_alarm'])
    assert mapped == {'hr', 'bp_sys', 'spo2'}
