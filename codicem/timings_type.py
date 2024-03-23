import io
import random
from typing import Optional, List, Tuple
from dataclasses import dataclass
from dataclasses_json import dataclass_json

INCOMPLETE = '~'

# Symbol Types
DOT = '.'
DASH = '-'
SYM_SPACE = 's'  # inter-symbol space
CHAR_SPACE = 'c'  # inter-character space
WORD_SPACE = '_'  # An actual space character
UNKNOWN = '?'  # Unknown symbol type

marks_stypes = [DOT, DASH]
spaces_stypes = [SYM_SPACE, CHAR_SPACE, WORD_SPACE]
all_stypes = marks_stypes + spaces_stypes


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


def load_timings_set_from_open_file(f, num_sets=-1):
    timings_set = []
    strings = []
    while num_sets == -1 or len(timings_set) < num_sets:
        timings, string = load_timings(f)
        if timings is None:
            break
        timings_set.append(timings)
        strings.append(string)
    return timings_set, strings


def load_timings_set(fname, num_sets=-1):
    with io.open(fname, 'rt') as f:
        return load_timings_set_from_open_file(f, num_sets)

