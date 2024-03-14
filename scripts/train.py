#!/usr/bin/env python3
import io
import os
import sys
from keras.callbacks import ModelCheckpoint
import tensorflow as tf

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

import codicem.morse_gen as mg
from codicem import morsenet
from codicem.timings_type import load_timings_set, load_timings_set_from_open_file


def main(args):
    if len(args) != 5:
        print("USAGE: " + args[0] + " <train_fname> <test_fname> <model_fname> <epochs>")
        return
    train_fname = args[1]
    test_fname = args[2]
    model_fname = args[3]
    epochs = int(args[4])
    batch_size = 1000

    # Init morse table
    mg.load_morse_table()

    # Configure or Load Model
    morse_net = morsenet.MorseNet()
    if os.path.exists(model_fname):
        print("Loading model from " + model_fname)
        morse_net.load(model_fname)
    else:
        print("Model does not exist at " + model_fname + ", so creating a new model")
        morse_net.compile_model()

    # Load test and train data
    # train_timings_set, train_strings = load_timings_set(train_fname)
    # test_timings_set, test_strings = load_timings_set(test_fname)

    def generator(fname: str):
        """Generator to load the timings set from a file and yield batches of data"""
        with io.open(fname, 'rt') as f:
            while True:
                timings_set, string = load_timings_set_from_open_file(f, batch_size)
                if timings_set is None or len(timings_set) == 0:
                    break
                batch, labels, space_labels = morse_net.timings_set2batch(timings_set)
                yield batch, (labels, space_labels)

    def create_dataset(fname: str) -> tf.data.Dataset:
        dataset: tf.data.Dataset = tf.data.Dataset.from_generator(
            generator,
            args=[fname],
            output_signature=(
                tf.TensorSpec(shape=(None, morse_net.num_steps, 1), dtype=tf.float32),
                (tf.TensorSpec(shape=(None, morse_net.num_outputs), dtype=tf.bool), tf.TensorSpec(shape=(None, 2), dtype=tf.bool))
            )
        )
        return dataset

    train_dataset = create_dataset(train_fname)
    test_dataset = create_dataset(test_fname)

    # Train

    # checkpointer = ModelCheckpoint(filepath=model_fname, verbose=1)
    # morse_net.fit(train_dataset, test_timings_set, epochs=epochs,
    #               batch_size=640, callbacks=[checkpointer])

    morse_net.model.fit(train_dataset, validation_data=test_dataset, epochs=epochs,
                        batch_size=640, callbacks=None)
    # Save - probably redundant to the checkpointer callback
    print("Saving model to " + model_fname)
    morse_net.save(model_fname)


main(sys.argv)
