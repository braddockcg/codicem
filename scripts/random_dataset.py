#!/usr/bin/env python3
import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import codicem.morse_gen as mg


def main(args):

    # Parameters
    if len(args) != 3:
        print("USAGE: random_dataset.py <n> <string_len>", file=sys.stderr)
        return

    n = int(args[1])
    string_len = int(args[2])

    # Initialize morse code table singleton
    _ = mg.load_morse_table()

    for i in range(n):
        # Generate random dataset
        # strings, timings_set = mg.generate_random_dataset(1, string_len)
        strings, timings_set = mg.generate_gaussian_dataset(
            1,
            string_len,
            mark_stddev=0.2,
            word_space_stddev=0.2,
            char_space_stddev=0.2,
            sym_space_stddev=0.2,
        )

        # Write dataset to stdout
        for string, timings in zip(strings, timings_set):
            mg.save_timings(sys.stdout, timings, string)


main(sys.argv)
