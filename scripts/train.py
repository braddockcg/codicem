#!/usr/bin/env python3

import os
import sys
import morse_gen as mg
import morsenet
from keras.callbacks import ModelCheckpoint


def main(args):
    if len(args) != 5:
        print("USAGE: " + args[0] + " <train_fname> <test_fname> <model_fname> <epochs>")
        return
    train_fname = args[1]
    test_fname = args[2]
    model_fname = args[3]
    epochs = int(args[4])
    use_cnn = True

    # Init morse table
    mg.load_morse_table()

    # Configure or Load Model
    morse_net = morsenet.MorseNet(use_cnn=use_cnn)
    if os.path.exists(model_fname):
        print("Loading model from " + model_fname)
        morse_net.load(model_fname)
    else:
        print("Model does not exist at " + model_fname + ", so creating a new model")
        morse_net.compile_model()

    # Load test and train data
    train_timings_set, train_strings = mg.load_timings_set(train_fname)
    test_timings_set, test_strings = mg.load_timings_set(test_fname)

    # Train
    checkpointer = ModelCheckpoint(filepath=model_fname, verbose=1)
    morse_net.fit(train_timings_set, test_timings_set, epochs=epochs,
                  batch_size=640, callbacks=[checkpointer])

    # Save - probably redundant to the checkpointer callback
    print("Saving model to " + model_fname)
    morse_net.save(model_fname)

main(sys.argv)
