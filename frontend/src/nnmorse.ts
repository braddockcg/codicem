// By Braddock Gaskill, October 2017
import {Timing, timingToString} from "./timing";
import {AudioSubsystem, Oscillator} from "./audio";
import {EasySocket} from "./easy_socket";

export const nnmorse = (function() {
    let audioSubsystem: AudioSubsystem
    let oscillator: Oscillator
    let lastEventTime: number
    let lastEventIsOn: boolean = false;
    let easysocket: EasySocket | null = null
    let onResultCallback: (symbols: Timing[]) => void
    let onSymbolsCallback: (symbols: Timing[]) => void
    let symbols: Timing[] = [];

    const init_socket = function () {
        console.log("Attempting to connect to websocket")
        easysocket = new EasySocket("ws://127.0.0.1:8765/decode_morse");
        easysocket.onJSONMessage = function(json) {
            const outputs = json as Timing[]
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
    }

    const init = function(audioSubsys: AudioSubsystem) {
        audioSubsystem = audioSubsys
        oscillator = audioSubsystem.createOscillator(440)
        lastEventTime = 0;

        init_socket()
        setTimeout(timeout, 250)
    }


    const send = function (eventIsOn: boolean) {
        const t = audioSubsystem.time()
        const dt = 1000. * (t - lastEventTime)
        lastEventTime = t

        const timing = new Timing(eventIsOn, dt)
        easysocket?.send(timingToString(timing))

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
        send(lastEventIsOn)
        setTimeout(timeout, 250)
    }

    const keydown = function() {
        // DEBUG:
        const t0 = audioSubsystem.time()
        const t0date = new Date().getTime();

        oscillator.turnOn()
        document.body.style.background = 'red';
        send(false);
        lastEventIsOn = true;

        // DEBUG
        // console.log("outputLatency: ", audioSubsystem.audioContext.outputLatency);
        // console.log("baseLatency: ", audioSubsystem.audioContext.baseLatency);

    };

    const keyup = function() {
        oscillator.turnOff()
        document.body.style.background = 'white'
        send(true)
        lastEventIsOn = false
    }

    const onResult = function(callback: (symbols: Timing[]) => void) {
        onResultCallback = callback
    }

    return {
        init: init,
        keydown: keydown,
        keyup: keyup,
        onResult: onResult,
        symbols: symbols,
        onSymbols: function(callback: (symbols: Timing[]) => void) {
            onSymbolsCallback = callback;
        }
    }
})();
