from typing import List

import numpy as np
from keras.models import Model, load_model
from keras.layers import Dense, Input, Conv1D, Flatten
from keras.src.layers import Concatenate, Dropout

from .timings_type import Timing
from . import timings_type
from . import util
from .timings_type import UNKNOWN


class MorseNet(object):
    def __init__(
            self,
            min_mark: float = 0.1,
            max_mark: float = 6.0,
            min_space: float = 0.1,
            max_space: float = 6.0,
            num_hidden=1024,
            num_steps=24,
    ):
        # Input Layer
        self.max_interval_time = 10.0

        # Number of RNN steps in the input sequence
        self.num_steps = num_steps

        # Hidden Layer
        self.num_hidden = num_hidden

        # Output Layer
        self.alphabet = sorted(util.morse_table().keys()) + [timings_type.INCOMPLETE]
        self.num_outputs = len(self.alphabet)

        # Timing parameters
        self.min_mark = min_mark
        self.max_mark = max_mark
        self.min_space = min_space
        self.max_space = max_space

        self.model = None

    def normalize(self, timings: List[Timing]) -> List[Timing]:
        """Normalize the timings to a standard duration within limits"""
        timings = timings_type.normalize(
            timings, self.num_steps, self.min_mark, self.max_mark, self.min_space, self.max_space
        )
        return timings

    def char2output(self, c):
        return self.alphabet.index(c)

    def output2char(self, idx):
        return self.alphabet[idx]

    def timings2cnn(self, timings) -> np.ndarray:
        timings = self.normalize(timings)
        padded_timings = util.pad_left(timings, self.num_steps,
                                       Timing(False, 0, UNKNOWN, '~', 0.0))
        vseq = []
        for t in padded_timings:
            d = t.duration
            if not t.is_on:
                d = -d
            vseq.append(d)
        v = np.array(vseq)
        v = np.reshape(v, (-1, 1))
        return v

    def timings2label(self, timings) -> str:
        """We train to the last character of the string, thus the
        label of the last Timing in the sequence"""
        return timings[-1].label

    def timings2label_encoding(self, timings) -> (np.ndarray, np.ndarray):
        """Convert the plaintext label of the last character in a
        sequence of Timing duration objects into a neural network output
        vector.  Also encode if the last OFF timing was a space as a
        second output vector"""
        v = np.zeros(self.num_outputs, dtype=bool)
        # some labels may be multiple characters, such as spaces ex. "A "
        label = self.timings2label(timings)
        if label is None:
            label = timings_type.INCOMPLETE
        idx = self.char2output(label[0])
        v[idx] = True
        if len(label) > 1 and label[1] == ' ':
            v_space = np.array([0, 1], dtype=bool)
        else:
            v_space = np.array([1, 0], dtype=bool)
        return v, v_space

    def timings_set2batch(self, timings_set) -> (np.ndarray, np.ndarray, np.ndarray):
        """A "timings_set" is a list of sequences of Timing duration objects.
        It is optionally labeled.  An input matrix appropriate as a batch
        input for the neural network is returned, along with batch labels
        output and space labels"""
        mseq = [self.timings2cnn(t) for t in timings_set]
        v = np.stack(mseq)
        labelseq = [self.timings2label_encoding(t) for t in timings_set]
        char_labels = [x[0] for x in labelseq]
        space_labels = [x[1] for x in labelseq]
        labels = np.stack(char_labels)
        labels_space = np.stack(space_labels)
        return v, labels, labels_space

    def compile_model(self) -> Model:
        """Create a CNN-based model.
        This is an alternative to the LSTM technique.
        It takes a 1-D vector of floats between 1.0 and -1.0.
        Each float represents an interval of time.
        Key-down is positive, and key-up is negative.
        The magnitude of the float is proportional to the duration
        of the interval.
        """
        input_layer = Input(shape=(self.num_steps, 1))

        # The purpose of this 1-element convolution is to
        # break the input encoding into constituent parts.
        # For example, we use negative numbers for key-off
        # and positive for key-on - this convolution can learn
        # these semantics and break them into separate dimensions.
        cnn1 = Conv1D(16, 1, activation='relu', use_bias=True)(input_layer)
        cnn2 = Conv1D(16, 8, activation='relu', use_bias=True)(input_layer)
        concat = Concatenate(axis=1)([cnn1, cnn2])
        # pool1 = MaxPooling1D(2)(cnn2)
        flatten = Flatten()(concat)
        hidden_layer1 = Dense(self.num_hidden, activation='relu',
                             name='hidden1')(flatten)
        dropout1 = Dropout(0.2)(hidden_layer1)
        hidden_layer2 = Dense(self.num_hidden, activation='relu',
                              name='hidden2')(dropout1)
        dropout2 = Dropout(0.2)(hidden_layer2)
        char_output = Dense(self.num_outputs, activation='softmax',
                            name='char_output')(dropout2)
        space_output = Dense(2, activation='softmax',
                             name='space_output')(dropout2)

        self.model = Model(inputs=[input_layer],
                           outputs=[char_output, space_output])
        self.model.compile(loss='categorical_crossentropy',
                           optimizer='rmsprop',
                           metrics=['accuracy'])

        # Print model information
        self.model.summary()

        return self.model

    def predict_raw(self, input_data: np.ndarray) -> (np.ndarray, np.ndarray):
        y, y_space = self.model.predict(input_data)
        return y, y_space

    def fit(self, train_timings_set, test_timings_set,
            batch_size=640, epochs=30, callbacks=None) -> None:
        # Convert Timing duration sets to Neural network vectors/matrices
        batch, labels, space_labels = self.timings_set2batch(train_timings_set)
        test_batch, test_labels, test_space_labels = self.timings_set2batch(
            test_timings_set)

        # Perform the fit
        self.model.fit(batch, [labels, space_labels],
                       batch_size=batch_size, epochs=epochs,
                       validation_data=(test_batch,
                                        [test_labels, test_space_labels]),
                       callbacks=callbacks)

    def predict(self, input_timings_set) -> (List[str], List[bool]):
        # Normalize the timings to a standard duration within limits
        input_batch, input_labels, input_space_labels = self.timings_set2batch(
            input_timings_set)
        y, y_space = self.model.predict(input_batch)
        y_char = [self.output2char(np.argmax(yy)) for yy in y]
        y_is_space = [space_output[0] < space_output[1]
                      for space_output in y_space]
        y_output = []
        for char, is_space in zip(y_char, y_is_space):
            s = char + (' ' if is_space else '')
            y_output.append(s)
        return y_output, y_is_space

    def save(self, fname) -> None:
        self.model.save(fname)

    def load(self, fname) -> None:
        self.model = load_model(fname)
