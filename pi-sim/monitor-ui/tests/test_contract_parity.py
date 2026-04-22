from __future__ import annotations

from pathlib import Path
import re

from monitor_ui.models import VitalFrame


def test_python_vital_frame_matches_typescript_contract() -> None:
    types_path = Path(__file__).resolve().parents[2] / 'scripts' / 'types.ts'
    types_text = types_path.read_text(encoding='utf-8')
    match = re.search(r'export interface VitalFrame \{(?P<body>.*?)\n\}', types_text, re.S)
    assert match, 'VitalFrame interface not found in scripts/types.ts'

    ts_fields = {
        name
        for name in re.findall(r'^\s*([A-Za-z_][A-Za-z0-9_]*)\??\s*:', match.group('body'), re.M)
    }
    py_fields = VitalFrame.known_field_names() - {'extra_fields'}

    assert py_fields == ts_fields
