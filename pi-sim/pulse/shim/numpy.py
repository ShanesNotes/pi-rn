"""Minimal numpy compatibility shim for Pulse imports.

Pulse eagerly imports helper modules that depend on numpy, even when pi-sim
never touches those plotting/comparison paths. This shim provides the small
surface needed for import-time compatibility and basic scalar operations.
"""

from __future__ import annotations

import math

__version__ = "0.0"

nan = float("nan")
inf = float("inf")


def isnan(value):
    try:
        return math.isnan(value)
    except TypeError:
        return False


def isinf(value):
    try:
        return math.isinf(value)
    except TypeError:
        return False


def isclose(a, b, rel_tol=1e-09, abs_tol=0.0):
    return math.isclose(a, b, rel_tol=rel_tol, abs_tol=abs_tol)


def sqrt(value):
    return math.sqrt(value)


def square(values):
    if isinstance(values, (list, tuple)):
        return [value * value for value in values]
    return values * values


def sum(values):
    return builtins_sum(values)


def floor(value):
    return math.floor(value)


def arange(start, stop=None, step=1):
    if stop is None:
        start, stop = 0, start
    values = []
    current = start
    if step == 0:
        raise ValueError("step must not be zero")
    if step > 0:
        while current < stop:
            values.append(current)
            current += step
    else:
        while current > stop:
            values.append(current)
            current += step
    return values


builtins_sum = __builtins__["sum"] if isinstance(__builtins__, dict) else __builtins__.sum
