// By Braddock Gaskill, October 2017
import {Timing, TimingBuffer, timingToString} from "./timing";
import {AudioSubsystem, Oscillator} from "./audio";
import {EasySocket} from "./easy_socket";

export const nnmorse = (function() {
    let audioSubsystem: AudioSubsystem
    let oscillator: Oscillator
    let lastEventTime: number
    let lastEventIsOn: boolean = false;
    let easysocket: EasySocket | null = null
    let symbols: TimingBuffer = new TimingBuffer(48);

    const init_socket = function () {
        console.log("Attempting to connect to websocket")
        easysocket = new EasySocket("ws://127.0.0.1:8765/decode_morse");
        easysocket.onJSONMessage = function(json) {
            const outputs = json as Timing[]
            const msg = outputs.slice(-1)[0]
            if (msg === undefined) {
                return
            }
            const t = symbols.getById(msg.tid)
            if (t) t.label = msg.label
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

        if (symbols.timings.length > 0 && symbols.timings[symbols.timings.length - 1].is_on === eventIsOn) {
            symbols.timings[symbols.timings.length - 1].duration += dt;
        } else {
            symbols.push(timing)
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


    return {
        init: init,
        symbols,
        keydown: keydown,
        keyup: keyup,
    }
})();
