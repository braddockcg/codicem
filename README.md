# Project Codicem - Morse Code for the 21st century
By Braddock Gaskill, March 2024
braddock@braddock.com

## Overview

Project Codicem aims to create an end-to-end framework for Morse Code
applications.

Components include:

- A robust machine learning Morse Code recognizer.

- A Bluetooth enabled telegraph key (using modified Bluetooth mouse)

- A system capable of running in an unmodified cell phone browser.

- A CW-based application navigation convention.

- A Python framework for adding CW applications on the server side.

- A websockets based protocol for transmission of key signalling for
  recognition or broadcast.

## Machine Learning Recognizer and Generated Training Data

The machine learning recognizer is a TensorFlow CNN with about a million
parameters.


### Generated Training Data

A training dataset is generated randomly.  We are currently optimizing this for
English text by using randomly selected windows of 5 symbols (letters and
spaces).  We select 5 symbol windows from two words, with a space between,
selected at random from the Unix /usr/share/dict/words vocabulary file.

To generate a test and train dataset, we current use the follow commands:

```bash
scripts/random_dataset.py 2000 4 >~/expire/morse/new-test
scripts/random_dataset.py 2000000 4 >~/expire/morse/new-train
```

Note that we are currently only training on letters of the alphabet and spaces.
We are not training on punctuation or other special characters.  We plan to do
this at a later date.


### Training

A 10 epoch training is launched with the following command:

```bash
scripts/train.py ~/expire/morse/new-train ~/expire/morse/new-test new.keras 10
```


## Backend Server

### HTTP Server

The server-side backend consists of a standard HTTP server and a Python Websocket service.  

The HTTP server can be any standard web server.  For testing we use python's
http-server module.  It can be launched as follow:

```bash
cd codicem/frontend/dist
python -m http.server 8080
```

`frontend/dist/` contains the `index.html` file and the WebPack bundle `codicem-bundle.js`.

The `codicem-bunder.js` is configured in the `codicem/webpack.config.js`.  We
use IntelliJ IDEA to build the bundle automatically when any of the TypeScript
files in `codicem/frontend/src` are modified.  This uses the IDEA WebPack plugin.

The bundle can be built manually on the command line using npx:

```bash
cd codicem/
npx webpack
```

Alternatively you can use `codicem/Makefile`.


### Websocket Server

The heart of the Codicem framework uses WebSockets.  

To use the Codicem python code, you must run poetry to create and install a
virtual environment, then then launch a shell using that environment:

```bash
pip install poetry
cd codicem/
poetry install
poetry shell
```

The Codicem WebSockets service can be launched as follows:

```bash
cd codicem/
python -m codicem --interface 0.0.0.0
```

The service listens for WebSocket connections on port 8765 by default.  This
can be changed using the `--port` argument.  The server runs only on the
loopback interface by default.  You must specify `--interface 0.0.0.0` if you
want to make external connections to the service from other devices.


### Websocket Services

The are currently two WebSocket services:

- `/decode_morse` runs the TensorFlow machine learning model to attempt to
  decode on and off timings from the Morse code keyer on the frontend.

- `/send_morse_timings` plays back a file of Morse code timings from the server.


## Frontend

The Codicem frontend is written in TypeScript and runs in a web browser - even
a phone's browser.  It communicates to the backend using WebSockets.  The
source is in `codicem/frontend/src`.


## Bluetooth Telegraph Key

The Bluetooth telegraph key is a straight key connected to a Bluetooth mouse.
The key wires are soldered to the mouse's left button switch.  A notch was
filed into the plastic side of the mouse, and one of the support posts inside
the mouse had to be filed down to fit the wires.  

The wires used were a bit thick, and when the mouse was reassembled top casing
was not flush and the plastic left button of the mouse did not reach the
switch, but the key worked perfectly.

The mouse used was a Logitech Pebble i345.

The modification is documented in photographs located in `codicem/pictures`.


## Future Work and Known Issues

- The TensorFlow recognizer is not very good.

- The TensorFlow reocgnizer has a hard time with spaces.  Spaces input manually
  are very different than those generated in the random dataset.

- A public website for entering manually keyed morse code would be valuable for
  obtaining real training data.

- A proper application framework needs to be designed and built.

- The decode\_morse recognizer is very slow.  On the GPU Tensorflow reports
  only 14 ms/step, but overall timing of the model.predict call results in
60-70 ms total.  This code needs to be profiled and optimized.  It cannot keep
up with manual keying, and recognition lags.  It does not seem to be
normalize() (see `notebooks/speed_optimization.ipynb`)

- If the browser is in the middle of a mark (key on), then there is no point
  sending the Timings to the decoder until the start of a space (key off)
  because the recognizer only recognizes a symbol on a space.  This would cut the
  number of recognition calls in half.

- If the recognizer returns a word space, and the browser is still in a key off
  state, then there is no point sending more Timings to the recognizer because
  the result should always be a (longer) word space.

- LCWO's heuristic recognizer has been included for reference in
  `frontend/src/lcwo.js`, but I have not been able to get it to function.

- For decoder comparison or training purposes, look at
  https://gitlab.com/scphillips/morse-pro
  Note that morse-pro does not seem to differentiate between character spaces
  and word spaces, which makes the problem much easier.

--- 
