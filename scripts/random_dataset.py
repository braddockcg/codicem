#!/usr/bin/env python3

import sys
import morse_gen as mg


def main(args):

    # Parameters
    if len(args) != 9:
        print("USAGE: random_dataset.py <n> <string_len> <min_wpm> <max_wpm> <p> <rnd_truncate> <rnd_len_char> <rnd_len_word>", file=sys.stderr)
        return
    n = int(args[1])
    string_len = int(args[2])
    min_wpm = int(args[3])
    max_wpm = int(args[4])
    p = float(args[5])
    rnd_truncate = int(args[6])
    lengthen_char_spaces = float(args[7])
    lengthen_word_spaces = float(args[8])

    # Initialize morse code table singleton
    _ = mg.load_morse_table()

    # Generate random dataset
    strings, timings_set = mg.generate_random_dataset(n, string_len,
            min_wpm=min_wpm, max_wpm=max_wpm, random_factor=p,
            rnd_truncate=rnd_truncate,
            lengthen_char_spaces=lengthen_char_spaces,
            lengthen_word_spaces=lengthen_word_spaces)

    # Write dataset to stdout
    for string, timings in zip(strings, timings_set):
        mg.save_timings(sys.stdout, timings, string)


main(sys.argv)
