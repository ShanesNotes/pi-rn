from __future__ import annotations

import signal
import sys

from monitor_ui.config import load_config
from monitor_ui.qt_compat import HAS_QT
from monitor_ui.theme import build_application_stylesheet


def main() -> int:
    if not HAS_QT:
        print(
            'monitor-ui requires PySide6. Install it with `pip install -r monitor-ui/requirements.txt`.',
            file=sys.stderr,
        )
        return 1

    from PySide6.QtCore import QTimer
    from PySide6.QtWidgets import QApplication

    from monitor_ui.main_window import MainWindow

    config = load_config()

    app = QApplication(sys.argv)
    app.setApplicationName('pi-sim monitor')
    app.setStyleSheet(build_application_stylesheet())

    window = MainWindow(config=config)
    window.show()

    if config.fullscreen:
        window.showFullScreen()

    signal.signal(signal.SIGINT, lambda *_: app.quit())

    keepalive_timer = QTimer()
    keepalive_timer.setInterval(100)
    keepalive_timer.timeout.connect(lambda: None)
    keepalive_timer.start()

    return app.exec()


if __name__ == '__main__':
    raise SystemExit(main())
