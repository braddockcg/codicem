// By Braddock Gaskill, October 2017
const nnmorse = (function() {
    let audioSubsystem;
    let oscillator;
    let lastEventTime;
    let lastEventIsOn = "OFF";
    let ws = null;
    let onResultCallback;
    let onSymbolsCallback;
    let symbols = [];

    const init_socket = function () {
        console.log("Attempting to connect to websocket")
        ws = new WebSocket("ws://127.0.0.1:8765/decode_morse");
        ws.onmessage = function(event) {
            const outputs = JSON.parse(event.data)
            const msg = outputs.slice(-1)[0]
            if (msg === undefined) {
                return
            }
            for (const s of symbols) {
                if (s.tid === msg.tid) {
                    s.label = msg.label
                }
            }
            symbols = symbols.slice(-40)
            if (onResultCallback) {
                onResultCallback(symbols)
            }
        }
        ws.onclose = function (event) {
            ws = null;
        }
        ws.onerror = function (event) {
            ws = null;
        }
    }

    const init = function(audioSubsys) {
        audioSubsystem = audioSubsys
        oscillator = audioSubsystem.createOscillator(440)
        lastEventTime = 0;

        setTimeout(timeout, 250)
    }


    const send = function (eventIsOn) {
        const t = audioSubsystem.time()
        const dt = 1000. * (t - lastEventTime)
        lastEventTime = t

        const timing = createTiming(eventIsOn, dt)
        if (ws.readyState === WebSocket.OPEN) {
            // ws.send(eventIsOn + "\t" + dt.toFixed(2) + "\t~\t~");
            // console.log(timingToString(timing))
            ws.send(timingToString(timing))
        }

        if (symbols.length > 0 && symbols[symbols.length - 1].is_on === eventIsOn) {
            symbols[symbols.length - 1].duration += dt;
        } else {
            symbols.push(timing)
        }
        symbols = symbols.slice(-40)
        if (onSymbolsCallback) {
            onSymbolsCallback(symbols)
        }
    }

    const timeout = function () {
        if (!ws) {
            init_socket();
        }
        if (ws.readyState !== WebSocket.OPEN) {
            console.log("Web socket status is: " + ws.readyState)
        }
        send(lastEventIsOn)
        setTimeout(timeout, 250)
    }

    const keydown = function() {
        // DEBUG:
        const t0 = audioSubsystem.time()
        const t0date = new Date().getTime();

        audioSubsystem.turnOnOscillator(oscillator)
        document.body.style.background = 'red';
        send("OFF");
        lastEventIsOn = "ON";

        // DEBUG
        console.log("A: ", audioSubsystem.time() - t0);
        console.log("B: ", new Date().getTime() - t0date);
        console.log("outputLatency: ", audioSubsystem.audioContext.outputLatency);
        console.log("baseLatency: ", audioSubsystem.audioContext.baseLatency);

    };

    const keyup = function() {
        audioSubsystem.turnOffOscillator(oscillator)
        document.body.style.background = 'white';
        send("ON");
        lastEventIsOn = "OFF";
    };

    const onResult = function(callback) {
        onResultCallback = callback;
    };

    return {
        init: init,
        keydown: keydown,
        keyup: keyup,
        onResult: onResult,
        symbols: symbols,
        onSymbols: function(callback) {
            onSymbolsCallback = callback;
        }
    }
})();
