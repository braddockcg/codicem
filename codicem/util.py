import os
import io
from typing import Optional, List


def wpm2dit_time(wpm):
    """Convert Words per minute (WPM) to dit time in milliseconds"""
    return 1200. / wpm


def intersperse(lst, item):
    """Put an item in between each element of a list."""
    result = [item] * (len(lst) * 2 - 1)
    result[0::2] = lst
    return result


def pad_left(seq, n, pad):
    """Pad or truncate a list"""
    seq = seq[-n:]
    seq = [pad] * (n - len(seq)) + seq
    return seq


def truncate(seq, n):
    """Truncate a list by removing n elements from the right
    Returns the result"""
    if n == 0:
        return seq
    return seq[:-n]


morse_lookup: Optional[dict] = None
morse_rlookup: Optional[dict] = None


def morse_table() -> dict:
    if morse_lookup is None:
        load_morse_table()
    return morse_lookup


def morse_rtable() -> dict:
    if morse_lookup is None:
        load_morse_table()
    return morse_rlookup


def load_morse_table(fname=None):
    global morse_lookup
    global morse_rlookup
    if fname is None:
        file_dir = os.path.dirname(os.path.abspath(__file__))
        fname = os.path.join(file_dir, 'morse_table.tsv')
    with io.open(fname, 'rt') as f:
        lines = f.readlines()
    table = [x.rstrip('\n').split('\t') for x in lines]
    morse_lookup = {x[0]: x[1] for x in table}
    morse_rlookup = {x[1]: x[0] for x in table}
    return morse_lookup, morse_rlookup


def char2dashdot(char):
    """Convert a single alphanumeric character to morse
    code in a string with '.', '-', and ' ' (space) symbols"""
    return morse_table()[char]


def dashdot2char(dashdot):
    """Convert ".-" to "A", for example """
    return morse_rtable()[dashdot]


def plaintext2dashdots(plaintext):
    """Convert plain text like "ABC" into a list of morse
    representation like ['.-', '-..', '-.-.']"""
    return [char2dashdot(char) for char in plaintext]


def dashdots2string(dashdots: List[str]) -> str:
    s = ''
    for dd in dashdots:
        try:
            c = dashdot2char(dd)
        except KeyError as e:
            c = '~'
        s += c
    return s


DICTIONARY_FILENAME = '/usr/share/dict/words'
word_dictionary: Optional[List[str]] = None


def load_word_dictionary(fname: str = DICTIONARY_FILENAME) -> List[str]:
    """Loads the standard Unix word dictionary"""
    with io.open(fname, 'rt') as f:
        words = f.readlines()
    words = [x.rstrip('\n') for x in words]
    return words


def get_word_dictionary() -> List[str]:
    """Gets the standard Unix word dictionary, loading it if necessary."""
    global word_dictionary
    if word_dictionary is None:
        word_dictionary = load_word_dictionary()
    return word_dictionary
