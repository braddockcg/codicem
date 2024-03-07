from timings_type import *
from util import *


def random_string(length, alphabet=None):
    if alphabet is None:
        letters = list(morse_table().keys())
        letters.extend([' '] * 5)  # Add more spaces
    else:
        letters = list(alphabet)
    list_of_letters = [random.choice(letters) for x in range(length)]
    return ''.join(list_of_letters)


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


def generate_random_dataset(n, string_len, letters=None, min_wpm=5, max_wpm=35,
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

