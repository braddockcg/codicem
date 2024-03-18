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


### Websocket Server

The heart of the Codicem framework uses WebSockets.  The Codicem WebSockets
service can be launched as follows:

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

- `/decode_morse` accesses the TensorFlow machine learning model to attempt to
  decode on and off timings from the Morse code keyer on the frontend.

- `/send_morse_timings` plays back a file of Morse code timings from the server.




--- 
