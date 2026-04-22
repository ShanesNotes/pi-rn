from __future__ import annotations

from typing import Any, Callable

HAS_QT = True

try:
    from PySide6.QtCore import QObject, QTimer, Signal
except ModuleNotFoundError:  # pragma: no cover - exercised in non-Qt test environments
    HAS_QT = False

    class _BoundSignal:
        def __init__(self) -> None:
            self._callbacks: list[Callable[..., Any]] = []

        def connect(self, callback: Callable[..., Any]) -> None:
            self._callbacks.append(callback)

        def emit(self, *args: Any, **kwargs: Any) -> None:
            for callback in list(self._callbacks):
                callback(*args, **kwargs)

    class Signal:
        def __init__(self, *_args: Any, **_kwargs: Any) -> None:
            self._storage_name = ''

        def __set_name__(self, _owner: type, name: str) -> None:
            self._storage_name = f'__signal_{name}'

        def __get__(self, instance: Any, _owner: type | None = None) -> Any:
            if instance is None:
                return self
            if not hasattr(instance, self._storage_name):
                setattr(instance, self._storage_name, _BoundSignal())
            return getattr(instance, self._storage_name)

    class QObject:
        def __init__(self, *_args: Any, **_kwargs: Any) -> None:
            pass

    class QTimer:
        def __init__(self, _parent: Any = None) -> None:
            self._interval_ms = 0
            self._running = False
            self.timeout = _BoundSignal()

        def setInterval(self, interval_ms: int) -> None:
            self._interval_ms = interval_ms

        def interval(self) -> int:
            return self._interval_ms

        def start(self) -> None:
            self._running = True

        def stop(self) -> None:
            self._running = False

        def isActive(self) -> bool:
            return self._running
