from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ThemeColors:
    background: str = "#000000"
    panel_background: str = "#090c12"
    panel_border: str = "#30353d"
    panel_muted: str = "#8f98a3"
    text: str = "#f3f7fb"
    good: str = "#44ff8a"
    cyan: str = "#47d7ff"
    yellow: str = "#ffd85c"
    red: str = "#ff5e63"
    white: str = "#f8fbff"


COLORS = ThemeColors()

FIELD_COLORS: dict[str, str] = {
    "hr": COLORS.good,
    "bp_sys": COLORS.white,
    "bp_dia": COLORS.white,
    "map": COLORS.white,
    "spo2": COLORS.cyan,
    "rr": COLORS.yellow,
    "temp_c": COLORS.yellow,
    "cardiac_output_lpm": COLORS.good,
    "stroke_volume_ml": COLORS.white,
    "etco2_mmHg": COLORS.yellow,
    "pao2_mmHg": COLORS.cyan,
    "paco2_mmHg": COLORS.yellow,
    "urine_ml_hr": COLORS.white,
    "ph": COLORS.white,
    "lactate_mmol_l": COLORS.yellow,
    "hgb_g_dl": COLORS.red,
}


def build_application_stylesheet() -> str:
    return f"""
    QWidget {{
        background-color: {COLORS.background};
        color: {COLORS.text};
        font-family: "DejaVu Sans", "Arial", sans-serif;
    }}

    QMainWindow {{
        background-color: {COLORS.background};
    }}

    QLabel[role="header"] {{
        color: {COLORS.white};
        font-size: 28px;
        font-weight: 600;
    }}

    QLabel[role="subheader"] {{
        color: {COLORS.panel_muted};
        font-size: 14px;
    }}

    QFrame[role="shellPanel"] {{
        background-color: {COLORS.panel_background};
        border: 1px solid {COLORS.panel_border};
        border-radius: 8px;
    }}

    QFrame[role="wavePlaceholder"] {{
        background-color: #020304;
        border: 1px solid {COLORS.panel_border};
        border-radius: 8px;
    }}

    QLabel[role="wavePlaceholderLabel"] {{
        color: {COLORS.panel_muted};
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 1px;
    }}

    QFrame[role="alarmBanner"] {{
        border: 1px solid {COLORS.panel_border};
        border-radius: 8px;
        background-color: #120506;
    }}

    QFrame[role="alarmBanner"][active="true"] {{
        background-color: {COLORS.red};
        border-color: #ff9498;
    }}

    QLabel[role="alarmBannerText"] {{
        font-size: 18px;
        font-weight: 700;
        color: {COLORS.white};
    }}

    QFrame[role="numericPanel"] {{
        background-color: {COLORS.panel_background};
        border: 1px solid {COLORS.panel_border};
        border-radius: 8px;
    }}

    QLabel[role="numericTitle"] {{
        color: {COLORS.panel_muted};
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 1px;
    }}

    QLabel[role="numericValue"] {{
        font-size: 44px;
        font-weight: 700;
    }}

    QLabel[role="numericUnit"] {{
        color: {COLORS.panel_muted};
        font-size: 13px;
    }}

    QLabel[role="numericMeta"] {{
        color: {COLORS.panel_muted};
        font-size: 12px;
    }}
    """
