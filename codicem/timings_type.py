import os
import io
import random
from typing import Optional, List
from dataclasses import dataclass
from dataclasses_json import dataclass_json
from .util import intersperse, plaintext2dashdots, wpm2dit_time

INCOMPLETE = '~'

# Symbol Types
DOT = '.'
DASH = '-'
SYM_SPACE = 's'  # inter-symbol space
CHAR_SPACE = 'c'  # inter-character space
WORD_SPACE = '_'  # An actual space character
UNKNOWN = '?'  # Unknown symbol type


@dataclass
@dataclass_json
class Timing(object):
    is_on: bool
    duration: float
    label: str
    stype: str
    wpm: float
    # tid is a unique identifier for this timing
    tid: int
    # global_tid is a counter for fast unique timing ids
    global_tid = random.randint(0, 10000000)

    def __init__(self,
                 is_on: bool,
                 duration: float,
                 stype: str,
                 label: Optional[str] = None,
                 wpm: float = 0,
                 tid: int = -1):
        assert stype in [DOT, DASH, SYM_SPACE, CHAR_SPACE, WORD_SPACE, UNKNOWN]
        self.is_on = is_on
        self.duration = duration
        self.label=label
        self.stype=stype  # Symbol type
        self.wpm = wpm
        self.tid = tid
        if tid == -1:
            self.tid = Timing.global_tid
            Timing.global_tid += 1

    def __repr__(self):
        s = "["
        if self.is_on:
            s += "ON "
        else:
            s += "OFF "
        s += str(self.duration) + ", '" + self.stype + ', ' + str(self.label) + "']"
        return s

    def is_space(self):
        return self.stype == WORD_SPACE

    def is_interchar_space(self):
        return self.stype == CHAR_SPACE


def copy_timing(timing: Timing) -> Timing:
    return Timing(timing.is_on, timing.duration, timing.stype, timing.label, timing.wpm, timing.tid)


def copy_timings(timings: List[Timing]) -> List[Timing]:
    return [copy_timing(t) for t in timings]


def save_timings(f, timings: List[Timing], string: str):
    print('TIMING\t' + string, file=f)
    for t in timings:
        is_on = "ON" if t.is_on else "OFF"
        duration = "%0.2f" % t.duration
        wpm = "%0.2f" % t.wpm
        tid = "%i" % t.tid
        print(is_on + '\t' + duration + '\t' + t.stype + '\t' + t.label + '\t' + wpm + '\t' + tid, file=f)
    print('END', file=f)


def save_timings_set(fname, timings_set, strings, append: bool = False):
    mode = 'at' if append else 'wt'
    with io.open(fname, mode) as f:
        for string, timings in zip(strings, timings_set):
            save_timings(f, timings, string)


def parse_timing(line):
    """Parse a single timing string, such as:
        OFF     157.64  B
    """
    cols = line.split('\t')
    if len(cols) == 5:
        cols.append(-1)
    (f_is_on, f_duration, f_stype, f_label, f_wpm, f_tid) = cols
    is_on = True if f_is_on == 'ON' else False
    duration = float(f_duration)
    wpm = float(f_wpm)
    tid = int(f_tid)
    return Timing(is_on, duration, f_stype, f_label, wpm, tid)


def load_timings(f):
    sync = f.readline()
    if not sync:  # EOF
        return None, None
    if sync.rstrip('\n').split('\t')[0] != 'TIMING':
        raise Exception("Unexpected string " + sync.strip())
    string = sync.rstrip('\n').split('\t')[1]
    timings = []
    while True:
        line = f.readline().rstrip('\n')
        if line == 'END':
            return timings, string
        t = parse_timing(line)
        timings.append(t)


def load_timings_set(fname, num_sets=-1):
    with io.open(fname, 'rt') as f:
        timings_set = []
        strings = []
        while True:
            timings, string = load_timings(f)
            if timings is None:
                break
            timings_set.append(timings)
            strings.append(string)
            if num_sets > 0 and len(timings_set) >= num_sets:
                break
    return timings_set, strings


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
