from __future__ import annotations

import importlib.util
import os
from pathlib import Path
import sys
import types

import pytest


REPO_ROOT = Path(__file__).resolve().parents[2]
MONITOR_UI_ROOT = REPO_ROOT / "monitor-ui"

if str(MONITOR_UI_ROOT) not in sys.path:
    sys.path.insert(0, str(MONITOR_UI_ROOT))

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")


def _install_pyside6_stub() -> None:
    if importlib.util.find_spec("PySide6") is not None:
        return

    class _BoundSignal:
        def __init__(self) -> None:
            self._callbacks: list[object] = []

        def connect(self, callback) -> None:
            self._callbacks.append(callback)

        def emit(self, *args, **kwargs) -> None:
            for callback in list(self._callbacks):
                callback(*args, **kwargs)

    class Signal:
        def __init__(self, *_args, **_kwargs) -> None:
            self._storage_name = ""

        def __set_name__(self, _owner, name: str) -> None:
            self._storage_name = f"__signal_{name}"

        def __get__(self, instance, _owner):
            if instance is None:
                return self
            if self._storage_name not in instance.__dict__:
                instance.__dict__[self._storage_name] = _BoundSignal()
            return instance.__dict__[self._storage_name]

    class QObject:
        def __init__(self, parent=None) -> None:
            self._parent = parent

    class QTimer(QObject):
        def __init__(self, parent=None) -> None:
            super().__init__(parent)
            self.timeout = _BoundSignal()
            self.interval = None
            self.started = False

        def setInterval(self, interval: int) -> None:
            self.interval = interval

        def start(self) -> None:
            self.started = True

        def stop(self) -> None:
            self.started = False

    class Qt:
        TextSelectableByMouse = 1
        AlignRight = 2
        AlignVCenter = 4
        AlignTop = 8
        AlignLeft = 16
        AlignCenter = 32
        AlignBottom = 64

    class _Style:
        def unpolish(self, _widget) -> None:
            return None

        def polish(self, _widget) -> None:
            return None

    class QWidget:
        def __init__(self, parent=None) -> None:
            self._parent = parent
            self._properties: dict[str, object] = {}
            self._visible = True
            self._style = _Style()

        def setProperty(self, name: str, value) -> None:
            self._properties[name] = value

        def property(self, name: str):
            return self._properties.get(name)

        def setSizePolicy(self, *_args) -> None:
            return None

        def setTextInteractionFlags(self, *_args) -> None:
            return None

        def setAlignment(self, *_args) -> None:
            return None

        def setStyleSheet(self, stylesheet: str) -> None:
            self._stylesheet = stylesheet

        def setVisible(self, visible: bool) -> None:
            self._visible = visible

        def isVisible(self) -> bool:
            return self._visible

        def update(self) -> None:
            return None

        def style(self) -> _Style:
            return self._style

        def show(self) -> None:
            self._shown = True

        def showFullScreen(self) -> None:
            self._fullscreen = True

    class QFrame(QWidget):
        pass

    class QLabel(QWidget):
        def __init__(self, text: str = "", parent=None) -> None:
            super().__init__(parent)
            self._text = text

        def setText(self, text: str) -> None:
            self._text = text

        def text(self) -> str:
            return self._text

    class QMainWindow(QWidget):
        def setWindowTitle(self, title: str) -> None:
            self._window_title = title

        def resize(self, width: int, height: int) -> None:
            self._size = (width, height)

        def setCentralWidget(self, widget) -> None:
            self._central_widget = widget

    class _Layout:
        def __init__(self, parent=None) -> None:
            self._parent = parent
            self._items: list[tuple[str, tuple[object, ...]]] = []

        def setContentsMargins(self, *_args) -> None:
            return None

        def setSpacing(self, *_args) -> None:
            return None

        def setHorizontalSpacing(self, *_args) -> None:
            return None

        def setVerticalSpacing(self, *_args) -> None:
            return None

        def addWidget(self, *args) -> None:
            self._items.append(("widget", args))

        def addLayout(self, *args) -> None:
            self._items.append(("layout", args))

        def addStretch(self, *args) -> None:
            self._items.append(("stretch", args))

    class QVBoxLayout(_Layout):
        pass

    class QHBoxLayout(_Layout):
        pass

    class QGridLayout(_Layout):
        pass

    class QSizePolicy:
        Expanding = 1

    class QApplication:
        def __init__(self, args) -> None:
            self._args = args
            self._application_name = ""
            self._stylesheet = ""
            self._quit_called = False

        def setApplicationName(self, name: str) -> None:
            self._application_name = name

        def setStyleSheet(self, stylesheet: str) -> None:
            self._stylesheet = stylesheet

        def exec(self) -> int:
            return 0

        def quit(self) -> None:
            self._quit_called = True

    pyside6 = types.ModuleType("PySide6")
    qtcore = types.ModuleType("PySide6.QtCore")
    qtwidgets = types.ModuleType("PySide6.QtWidgets")

    qtcore.QObject = QObject
    qtcore.QTimer = QTimer
    qtcore.Signal = Signal
    qtcore.Qt = Qt

    qtwidgets.QApplication = QApplication
    qtwidgets.QFrame = QFrame
    qtwidgets.QGridLayout = QGridLayout
    qtwidgets.QHBoxLayout = QHBoxLayout
    qtwidgets.QLabel = QLabel
    qtwidgets.QMainWindow = QMainWindow
    qtwidgets.QSizePolicy = QSizePolicy
    qtwidgets.QVBoxLayout = QVBoxLayout
    qtwidgets.QWidget = QWidget

    pyside6.QtCore = qtcore
    pyside6.QtWidgets = qtwidgets

    sys.modules["PySide6"] = pyside6
    sys.modules["PySide6.QtCore"] = qtcore
    sys.modules["PySide6.QtWidgets"] = qtwidgets


_install_pyside6_stub()


@pytest.fixture(autouse=True)
def reset_vitalframe_warning_state():
    from monitor_ui.models import VitalFrame

    VitalFrame._warned_extra_fields.clear()
    yield
    VitalFrame._warned_extra_fields.clear()
