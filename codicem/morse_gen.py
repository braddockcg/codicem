from .timings_type import *
from .util import *


def random_string(length, alphabet=None):
    if alphabet is None:
        letters = list(morse_table().keys())
        letters.extend([' '] * 5)  # Add more spaces
    else:
        letters = list(alphabet)
    list_of_letters = [random.choice(letters) for x in range(length)]
    return ''.join(list_of_letters)


def random_string_from_dictionary(length):
    words = get_word_dictionary()
    word1 = random.choice(words).upper()
    word2 = random.choice(words).upper()
    word1 = ''.join([c for c in word1 if c in morse_table()])
    word2 = ''.join([c for c in word2 if c in morse_table()])
    s = word1 + ' ' + word2
    if len(s) <= length:
        return s + ' ' * (length - len(s))
    start = random.randint(0, len(s) - length)
    return s[start:start + length]


def random_truncate(seq, n):
    n = random.randint(0, n)
    return truncate(seq, n)


def random_lengthen_timing(timing, p, stype):
    if timing.stype != stype:
        return timing
    d = timing.duration
    d = d + d * p * random.random()
    return Timing(timing.is_on, d, timing.stype, timing.label)


def random_lengthen_timings(seq, p, stype):
    return [random_lengthen_timing(t, p, stype) for t in seq]


def randomize_timing(timing, p):
    """Create a new Timing object with a randomly altered duration.
    p is the degree of alteration (0.2 == plus or minus 20%). p should
    be between 0.0 and 1.0 inclusive."""
    assert(p <= 1.0 and p >= 0.0)
    d = timing.duration
    d = d + d * p * (2.0 * random.random() - 1.0)
    return Timing(timing.is_on, d, timing.stype, timing.label, timing.wpm)


def randomize_timings(timings, p):
    """Add noise to the timings"""
    return [randomize_timing(t, p) for t in timings]


def old_generate_random_dataset(
        n, string_len, letters=None, min_wpm=5, max_wpm=35,
        random_factor=0.2, rnd_truncate=0,
        lengthen_char_spaces=0.0, lengthen_word_spaces=0.0):
    """Generate a random dataset"""
    strings = [random_string(string_len, letters) for x in range(n)]
    timings_set = [plaintext2training(x) for x in strings]

    # Randomly adjust the send rate in words per minute
    timings_set = [scale_timings(timings, random.randint(min_wpm, max_wpm)) for timings in timings_set]

    # Randomly add noise to the timings
    timings_set = [randomize_timings(timings, random_factor) for timings in timings_set]

    # Randomly truncate the timings
    timings_set = [random_truncate(timings, rnd_truncate) for timings in timings_set]

    # Randomly lengthen inter-character and inter-word spaces
    timings_set = [random_lengthen_timings(timings, lengthen_char_spaces, CHAR_SPACE) for timings in timings_set]
    timings_set = [random_lengthen_timings(timings, lengthen_word_spaces, WORD_SPACE) for timings in timings_set]

    return strings, timings_set


def randomize_symbols(
        timings: List[Timing],
        min_dit: float,
        max_dash: float,
        min_sym_space: float,
        max_word_space: float,
) -> List[Timing]:
    """Randomize normal (dit=1 etc) timings within limits"""
    timings = copy_timings(timings)
    for t in timings:
        if t.stype == DOT:
            t.duration = random.uniform(min_dit, 1)
        elif t.stype == DASH:
            t.duration = random.uniform(1, max_dash)
        elif t.stype == SYM_SPACE:
            t.duration = random.uniform(min_sym_space, 1)
        elif t.stype == CHAR_SPACE:
            t.duration = random.uniform(1, 3)
        elif t.stype == WORD_SPACE:
            t.duration = random.uniform(3, max_word_space)
        else:
            raise ValueError(f"Unknown symbol type {t.stype}")
    return timings


def generate_random_dataset(
        n,
        string_len,
        min_dit = 0.1,
        max_dash = 6.0,
        min_sym_space = 0.1,
        max_word_space = 6.0,
        rnd_truncate = 2,
        use_dictionary = True,
) -> (List[str], List[List[Timing]]):
    """Generate a random dataset"""

    random_string_func = random_string_from_dictionary if use_dictionary else random_string

    # Generate random strings
    strings = [random_string_func(string_len) for _ in range(n)]

    # Convert the strings to timings
    timings_set = [plaintext2training(x) for x in strings]

    # Randomly truncate the timings
    timings_set = [random_truncate(timings, rnd_truncate) for timings in timings_set]

    # Randomly adjust durations
    timings_set = [
        randomize_symbols(
            timings,
            min_dit,
            max_dash,
            min_sym_space,
            max_word_space,
        )
        for timings in timings_set
    ]

    # Normalize the timings
    timings_set = [normalize_timings(timings) for timings in timings_set]

    return strings, timings_set
