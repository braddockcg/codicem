
import numpy as np
from keras.models import Model, load_model
from keras.layers import (Dense, Input, LSTM, Conv1D,
                          MaxPooling1D, Flatten)
from timings_type import Timing
import timings_type
import util


class MorseNet(object):
    def __init__(self, num_hidden=32, num_rnn_steps=48,
                 min_wpm=5, max_wpm=35, num_wpm=16, use_cnn=False):
        ### Input Layer
        self.min_wpm = min_wpm
        self.max_wpm = max_wpm
        self.num_wpm = num_wpm
        min_dit_time = util.wpm2dit_time(max_wpm)
        max_dah_time = 3. * util.wpm2dit_time(min_wpm)
        self.max_interval_time = 2.0 * max_dah_time
        self.input_thresholds = np.arange(0.0,
                                          2.0 * max_dah_time,
                                          min_dit_time / 4.0)
        # input one hot encoded duration 0..max_input-1
        self.max_input = len(self.input_thresholds)

        # Inputs are paired.  One input indicates the timing is ON,
        # the other input indicates the timing is OFF
        self.num_inputs = self.max_input * 2

        # Number of RNN steps in the input sequence
        self.num_rnn_steps = num_rnn_steps

        ### Hidden Layer
        self.num_hidden = num_hidden

        ### Output Layer
        self.alphabet = sorted(util.morse_table().keys()) + [timings_type.INCOMPLETE]
        self.num_outputs = len(self.alphabet)

        self.model = None
        self.use_cnn = use_cnn

    def timing2input(self, timing):
        """Convert a duration Timing object to an input vector
        for the LSTM"""
        v = np.zeros(self.num_inputs, dtype=bool)
        # FIXME! BUG! If duration > max input_threshold,
        # argmax returns 0.  Fix and retrain everywhere!
        idx = np.argmax(self.input_thresholds >= timing.duration)
        i = timing.is_on * self.max_input + idx
        v[i] = True
        return v

    def char2output(self, c):
        return self.alphabet.index(c)

    def output2char(self, idx):
        return self.alphabet[idx]

    def output2wpm(self, idx):
        #         idx = int((self.num_wpm - 1) * (wpm - self.min_wpm) /
        #                   (self.max_wpm - self.min_wpm))
        return self.min_wpm + idx * ((self.max_wpm - self.min_wpm) / (self.num_wpm - 1))

    def timing2output(self, timing):
        return self.char2output(timing[2])

    def timings2matrix(self, timings):
        """Convert a sequence of Timing objects into a matrix
        of neural network input encoding vectors"""
        padded_timings = util.pad_left(timings, self.num_rnn_steps,
                                     Timing(False, 0, None, '~'))
        vseq = [self.timing2input(t) for t in padded_timings]
        v = np.vstack(vseq)
        return v

    def timings2cnn(self, timings):
        padded_timings = util.pad_left(timings, self.num_rnn_steps,
                                     Timing(False, 0, None, '~', 0.0))
        vseq = []
        for t in padded_timings:
            d = min(t.duration, self.max_interval_time)
            d = d / self.max_interval_time
            if not t.is_on:
                d = -d
            vseq.append(d)
        v = np.array(vseq)
        v = np.reshape(v, (-1, 1))
        return v

    def timings2label(self, timings):
        """We train to the last character of the string, thus the
        label of the last Timing in the sequence"""
        return timings[-1].label

    def timings2label_encoding(self, timings):
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
        # wpm encoding
        wpm = timings[-1].wpm
        wpm = max(self.min_wpm, wpm)
        wpm = min(self.max_wpm, wpm)
        idx = int((self.num_wpm - 1) * (wpm - self.min_wpm) /
                  (self.max_wpm - self.min_wpm))
        v_wpm = np.zeros(self.num_wpm, dtype=bool)
        v_wpm[idx] = True
        return v, v_space, v_wpm

    def timings_set2batch(self, timings_set):
        """A "timings_set" is a list of sequences of Timing duration objects.
        It is optionally labeled.  An input matrix appropriate as a batch
        input for the neural network is returned, along with batch labels
        output and space labels"""
        if self.use_cnn:
            mseq = [self.timings2cnn(t) for t in timings_set]
        else:
            mseq = [self.timings2matrix(t) for t in timings_set]
        v = np.stack(mseq)
        labelseq = [self.timings2label_encoding(t) for t in timings_set]
        char_labels = [x[0] for x in labelseq]
        space_labels = [x[1] for x in labelseq]
        wpm_labels = [x[2] for x in labelseq]
        labels = np.stack(char_labels)
        labels_space = np.stack(space_labels)
        labels_wpm = np.stack(wpm_labels)
        return v, labels, labels_space, labels_wpm

    def compile_lstm_model(self):
        """Create the LSTM model"""
        input_layer = Input(shape=(self.num_rnn_steps, self.num_inputs))
        lstm1 = LSTM(self.num_hidden,
                     input_shape=(self.num_rnn_steps,
                                  self.num_inputs))(input_layer)

        hidden2_layer = Dense(self.num_hidden, activation='relu',
                              name='hidden2')(lstm1)

        char_output = Dense(self.num_outputs, activation='softmax',
                            name='char_output')(hidden2_layer)
        space_output = Dense(2, activation='softmax',
                             name='space_output')(hidden2_layer)

        self.model = Model(inputs=[input_layer],
                           outputs=[char_output, space_output])
        self.model.compile(loss='categorical_crossentropy',
                           #optimizer='rmsprop',
                           optimizer='adam',
                           metrics=['accuracy'])
        return self.model

    def compile_cnn_model(self):
        """Create a CNN-based model.
        This is an alternative to the LSTM technique.
        It takes a 1-D vector of floats between 1.0 and -1.0.
        Each float represents an interval of time.
        Key-down is positive, and key-up is negative.
        The magnitude of the float is proportional to the duration
        of the interval.
        """
        input_layer = Input(shape=(self.num_rnn_steps, 1))

        # The purpose of this 1-element convolution is to
        # break the input encoding into constituent parts.
        # For example, we use negative numbers for key-off
        # and positive for key-on - this convolution can learn
        # these semantics and break them into seperate dimensions.
        cnn1 = Conv1D(4, 1, activation='relu')(input_layer)
        cnn2 = Conv1D(4, 1, activation='relu')(cnn1)
        cnn3 = Conv1D(4, 12)(cnn2)
        # pool1 = MaxPooling1D(2)(cnn2)
        flatten = Flatten()(cnn3)
        hidden_layer = Dense(self.num_hidden, activation='relu',
                             name='hidden')(flatten)

        char_output = Dense(self.num_outputs, activation='softmax',
                            name='char_output')(hidden_layer)
        space_output = Dense(2, activation='softmax',
                             name='space_output')(hidden_layer)
        wpm_output = Dense(self.num_wpm, activation='softmax',
                           name='wpm_output')(hidden_layer)

        self.model = Model(inputs=[input_layer],
                           outputs=[char_output, space_output, wpm_output])
        self.model.compile(loss='categorical_crossentropy',
                           optimizer='rmsprop',
                           metrics=['accuracy'])
        return self.model

    def compile_model(self):
        if self.use_cnn:
            self.compile_cnn_model()
        else:
            self.compile_lstm_model()

    def predict_raw(self, input_data):
        y, y_space = self.model.predict(input_data)
        return y, y_space

    def fit(self, train_timings_set, test_timings_set,
            batch_size=640, epochs=30, callbacks=None):
        # Convert Timing duration sets to Neural network vectors/matrices
        batch, labels, space_labels, wpm_labels = self.timings_set2batch(train_timings_set)
        test_batch, test_labels, test_space_labels, test_wpm_labels = self.timings_set2batch(
            test_timings_set)

        # Perform the fit
        self.model.fit(batch, [labels, space_labels, wpm_labels],
                       batch_size=batch_size, epochs=epochs,
                       validation_data=(test_batch,
                                        [test_labels, test_space_labels, test_wpm_labels]),
                       callbacks=callbacks)

    def print_inputs(self, inputs, timings):
        for i in range(inputs.shape[1]):
            for j in range(inputs.shape[2]):
                if inputs[0, i, j] != 0:
                    print("IN: ", i, j, timings[0][i])

    def predict(self, input_timings_set):
        padded_timings_set = [mg.pad_left(timings, self.num_rnn_steps,
                                          mg.Timing(False, 0, None,
                                                    mg.INCOMPLETE))
                              for timings in input_timings_set]
        input_batch, input_labels, input_space_labels, input_wpm = self.timings_set2batch(
            padded_timings_set)
        #self.print_inputs(input_batch, padded_timings_set)
        y, y_space, y_wpm = self.model.predict(input_batch)
        y_char = [self.output2char(np.argmax(yy)) for yy in y]
        y_is_space = [space_output[0] < space_output[1]
                      for space_output in y_space]
        wpm = [self.output2wpm(np.argmax(w)) for w in y_wpm]
        y_output = []
        for char, is_space in zip(y_char, y_is_space):
            s = char + (' ' if is_space else '')
            y_output.append(s)
        return y_output, wpm

    def save(self, fname):
        self.model.save(fname)

    def load(self, fname):
        self.model = load_model(fname)
