from copy import copy
import numpy as np

from .util import intersperse, plaintext2dashdots, wpm2dit_time, dashdot2char
from timings_type import *


def dashdotchar2timing(dashdotchar, label=None):
    """Convert a '.', a '-', or a ' ' to a Timing
    object encoding duration and an optional label"""
    if dashdotchar == '.':
        return Timing(True, 1, DOT, label)
    elif dashdotchar == '-':
        return Timing(True, 3, DASH, label)
    elif dashdotchar == ' ':
        return Timing(False, 7, WORD_SPACE, label)
    else:
        raise Exception("Unreconized dashdot, should be . or - or space")


def dashdot2timing(dashdot, label):
    """Convert a "dashdot" representation, such as '.--' as returned by and
    element of plaintext2dashdots() into a list of Timing duration objects"""
    r = [dashdotchar2timing(d, label) for d in dashdot]
    return intersperse(r, Timing(False, 1, SYM_SPACE, label))


def dashdots2timings(dashdots, labels):
    """Convert a "dashdotS" representation, which is a list of encoded
    characters such as ['.--', '.-'], into a list of lists of Timing
    duration objects"""
    return [dashdot2timing(dd, label) for dd, label in zip(dashdots, labels)]


def flatten_timings(timings):
    """Return last flattened timings and labels"""
    r = []
    for timing in timings:
        r.extend(timing)
        r.append(Timing(False, 3, CHAR_SPACE, timing[0].label))  # Inter-character space

    # Now remove inter-character space before spaces
    r2 = []
    for i in range(len(r) - 1):
        if r[i].is_interchar_space() and r[i+1].is_space():
            pass
        else:
            r2.append(r[i])
    r2.append(r[-1])

    # Now remove inter-character spaces after spaces
    r3 = [r2[0]]
    for i in range(len(r2) - 1):
        if r2[i+1].is_interchar_space() and r2[i].is_space():
            pass
        else:
            r3.append(r2[i+1])

    # Modify the labels on spaces to reflect the prior character
    # We actually use two-character labels, "A "
    prior_label = None
    for t in r3:
        if prior_label is not None and prior_label != ' ' and t.is_space():
            t.label = prior_label + ' '
        if not t.is_space():
            prior_label = t.label
        else:
            prior_label = None

    # Remove labels from everything except spaces and inter-character spaces
    for t in r3:
        if not t.is_space() and not t.is_interchar_space():
            t.label = INCOMPLETE

    return r3


def timings2training(timings):
    flat_timings = flatten_timings(timings)
    return flat_timings


def plaintext2training(plaintext: str) -> List[Timing]:
    dd = plaintext2dashdots(plaintext)
    timings = dashdots2timings(dd, plaintext)
    flat = flatten_timings(timings)
    return flat


def average_mark_length(timings: List[Timing]) -> float:
    """Return the average length of the marks (dits and dahs)"""
    marks = [t for t in timings if t.is_on]
    if len(marks) == 0:
        return 0
    return sum([t.duration for t in marks]) / len(marks)


def average_space_length(timings: List[Timing]) -> float:
    """Return the average length of the spaces"""
    spaces = [t for t in timings if not t.is_on]
    if len(spaces) == 0:
        return 0
    return sum([t.duration for t in spaces]) / len(spaces)


def normalize_marks(timings: List[Timing]) -> List[Timing]:
    """Normalize the mark lengths to the PARIS standard"""
    timings = copy_timings(timings)
    avg_mark = average_mark_length(timings)
    if avg_mark == 0:
        return timings
    scale = normalize_marks.paris_avg_mark / avg_mark
    for t in timings:
        if t.is_on:
            t.duration *= scale
    return timings


# The average standard mark length for PARIS
normalize_marks.paris_avg_mark = average_mark_length(plaintext2training("PARIS "))


def normalize_spaces(timings: List[Timing]) -> List[Timing]:
    """Normalize the space lengths to match the PARIS standard"""
    timings = copy_timings(timings)
    avg_space = average_space_length(timings)
    if avg_space == 0:
        return timings
    scale = normalize_spaces.paris_avg_space / avg_space
    for t in timings:
        if not t.is_on:
            t.duration *= scale
    return timings


# The average standard mark length for PARIS
normalize_spaces.paris_avg_space = average_space_length(plaintext2training("PARIS "))


def normalize_timings(timings: List[Timing]) -> List[Timing]:
    """Normalize the timings to match the PARIS standard (approx 1=dit, 3=dah, etc)"""
    timings = normalize_marks(timings)
    timings = normalize_spaces(timings)
    return timings


def scale_timing(timing: Timing, wpm: float) -> Timing:
    """Scale the duration of a Timing object from standard (1=dit, 3=dah, etc)
    to the specified Words per minute equivalent and return a new Timing
    object with the scaled duration."""
    scale = wpm2dit_time(wpm)
    return Timing(timing.is_on, timing.duration * scale, timing.stype, timing.label, wpm=wpm)


def scale_timings(timings: List[Timing], wpm: float) -> List[Timing]:
    """Scale the timings to different wpm"""
    timings = normalize_timings(timings)
    return [scale_timing(t, wpm) for t in timings]


def restrict_mark_space_times(
        timings: List[Timing],
        min_mark: float,
        max_mark: float,
        min_space: float,
        max_space: float,
) -> List[Timing]:
    """Restrict the durations of the symbols to the specified ranges"""
    timings = copy_timings(timings)
    for t in timings:
        if t.is_on:
            t.duration = max(min_mark, min(max_mark, t.duration))
        else:
            t.duration = max(min_space, min(max_space, t.duration))
    return timings


def normalize(
        timings: List[Timing],
        num_steps: int,
        min_mark: float,
        max_mark: float,
        min_space: float,
        max_space: float,
) -> List[Timing]:
    """Normalize the timings to a standard duration within limits"""
    timings = timings[-num_steps:]
    timings = normalize_timings(timings)
    timings = restrict_mark_space_times(
        timings, min_mark, max_mark, min_space, max_space
    )
    # We normalize again with the outliers reduced
    timings = normalize_timings(timings)
    return timings


def timings2dashdots(timings: List[Timing]) -> Tuple[List[str], List[Timing]]:
    dd = []
    sym = ''
    new_timings = []
    for t in timings:
        new_timings.append(copy(t))
        new_timings[-1].label = '~'
        if t.stype == DOT:
            sym += '.'
        elif t.stype == DASH:
            sym += '-'
        elif t.stype == WORD_SPACE:
            if len(sym) > 0:
                dd.append(sym)
                try:
                    new_timings[-1].label = dashdot2char(sym) + ' '
                except KeyError:
                    new_timings[-1].label = ' '
            dd.append(' ')
        elif t.stype == CHAR_SPACE:
            if len(sym) > 0:
                dd.append(sym)
                try:
                    new_timings[-1].label = dashdot2char(sym)
                except KeyError:
                    pass
            sym = ''
        elif t.stype == SYM_SPACE:
            pass
        else:
            raise ValueError(f"Unknown stype {t.stype}")

    return dd, new_timings


def separate_durations_by_stype(timings_set: List[List[Timing]]) -> dict:
    """Return a dictionary of durations for each symbol type
    in the timings set.
    """
    durations = {}
    for sym in marks_stypes + spaces_stypes:
        durations[sym] = np.array([t.duration
                                   for timing in timings_set
                                   for t in timing if t.stype == sym])
    return durations
