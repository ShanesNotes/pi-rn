"""Minimal pandas compatibility shim for Pulse imports.

Pulse's Python engine imports plotting/CSV helper modules that import pandas at
module load time, even though pi-sim does not use those plotting paths. The
real pandas package is large and unavailable in this runtime by default, so
this shim provides the small surface needed for import-time compatibility.

If Pulse execution later reaches CSV/plot paths that truly require pandas,
raise loudly so the failure is explicit.
"""

from __future__ import annotations


class DataFrame:
    def __init__(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs


class Series:
    def __init__(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs


def read_csv(*args, **kwargs):
    raise NotImplementedError("pandas.read_csv is unavailable in the pi-sim Pulse shim runtime")


def to_numeric(value, **kwargs):
    return value
