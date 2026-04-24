import importlib.util
import subprocess
from pathlib import Path

SHIM_APP_PATH = Path(__file__).with_name("app.py")
SPEC = importlib.util.spec_from_file_location("pulse_shim_app", SHIM_APP_PATH)
assert SPEC is not None and SPEC.loader is not None
app = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(app)


def test_driver_failure_message_includes_paths_and_bounded_output():
    result = subprocess.CompletedProcess(
        args=["PulseScenarioDriver", "scenario.json"],
        returncode=42,
        stdout="x" * (app.MAX_DRIVER_OUTPUT_CHARS + 20),
        stderr="driver stderr",
    )

    message = app._driver_failure_message(
        "advance",
        Path("/tmp/scenario.json"),
        Path("/tmp/results.csv"),
        Path("/tmp/next-state.json"),
        result,
    )

    assert "returncode: 42" in message
    assert "scenario: /tmp/scenario.json" in message
    assert "expected_results: /tmp/results.csv" in message
    assert "expected_next_state: /tmp/next-state.json" in message
    assert "driver stderr" in message
    assert "truncated 20 characters" in message


def test_auth_allows_requests_when_no_token_configured(monkeypatch):
    monkeypatch.delenv("PULSE_SHIM_TOKEN", raising=False)
    assert app._request_authorized("/advance", {})


def test_auth_exempts_health_when_token_configured():
    assert app._request_authorized("/health", {}, token="secret")
    assert app._request_authorized("/health?verbose=1", {}, token="secret")


def test_auth_accepts_bearer_and_x_header_tokens():
    assert app._request_authorized(
        "/advance",
        {"Authorization": "Bearer secret"},
        token="secret",
    )
    assert app._request_authorized(
        "/advance",
        {"X-Pulse-Shim-Token": "secret"},
        token="secret",
    )


def test_auth_rejects_missing_or_wrong_tokens():
    assert not app._request_authorized("/advance", {}, token="secret")
    assert not app._request_authorized(
        "/advance",
        {"Authorization": "Bearer wrong"},
        token="secret",
    )


def test_state_mutating_route_detection_handles_query_strings():
    for route in ("/init", "/advance", "/action", "/state/save"):
        assert app._is_state_mutating_path(f"{route}?trace=1")
    assert not app._is_state_mutating_path("/health?trace=1")
