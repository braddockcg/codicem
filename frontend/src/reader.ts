// Read a Morse code signal from the server, sound it and draw it on a canvas

import {Timing, timingFromJson, TimingBuffer} from "./timing";
import {AudioSubsystem} from "./audio";
import {EasySocket} from "./easy_socket";

export const Reader = function(uri: string, filename: string, wpm: number, audioSubsystem: AudioSubsystem) {
    const oscillator = audioSubsystem.createOscillator(300)
    let onSymbolsCallback: (symbols: TimingBuffer) => void
    let symbols = new TimingBuffer(30)
    let pending: Timing[] = []
    let nextTime = 0
    let onResultCallback: (timing: Timing) => void

    const easysocket = new EasySocket(uri);

    const play_next = function() {
        // console.log("play_next queue size = " + pending.length, " nextTime = " + nextTime, " time = " + audioSubsystem.time())
        if (pending.length == 0 || audioSubsystem.time() < nextTime) {
            setInterval(play_next, 1000 * (nextTime - audioSubsystem.time()))
            return
        }
        const timing = pending.shift()
        if (!timing) {
            return
        }
        if (onResultCallback && timing) {
            onResultCallback(timing)
        }
        if (timing.is_on) {
            oscillator.turnOn()
        } else {
            oscillator.turnOff()
        }
        symbols.push(timing)
        if (onSymbolsCallback) {
            onSymbolsCallback(symbols)
        }
        nextTime = audioSubsystem.time() + timing.duration / 1000
        setInterval(play_next, timing.duration)
    }

    easysocket.onTextMessage = function(text) {
        const timing = timingFromJson(text);
        pending.push(timing)
        if (pending.length == 1) {
            play_next()
        }
    }

    easysocket.onOpen = function(event) {
        console.log("Reader Connection opened");
        easysocket.send(wpm + "\t" + filename)
    }

    return {
        symbols,
        onResult: function(callback: (timing: Timing) => void) {
            onResultCallback = callback
        }
    }
}
