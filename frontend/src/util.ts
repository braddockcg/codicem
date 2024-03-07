// Utility functions for morse code project
// By Braddock Gaskill, March 2024

const AudioSubsystem = function() {
    const audioContext = new AudioContext();

    const createOscillator = function(freq) {
        const osc = audioContext.createOscillator();
        osc.frequency.value = freq;
        osc.type = 'sine';

        const gain = audioContext.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(audioContext.destination);

        const s = {'osc': osc, 'gain': gain}
        setOscillatorGain(s, 0.0)
        osc.start()
        return s;
    }

    const setOscillatorGain = function(osc, value) {
        const gain = osc.gain
        audioContext.resume()
        gain.gain.value = value;
    }

    const turnOnOscillator = function(osc) {
        setOscillatorGain(osc, 0.25)
    }

    const turnOffOscillator = function(osc) {
        setOscillatorGain(osc, 0.0)
    }

    return {
        audioContext: audioContext,
        createOscillator: createOscillator,
        turnOnOscillator: turnOnOscillator,
        turnOffOscillator: turnOffOscillator,
        time: function() { return audioContext.currentTime },
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

let global_tid = getRandomInt(10000000)
const createTiming = function(is_on, duration, stype, label, wpm, tid) {
    return {
        is_on: is_on,
        duration: duration,
        stype: stype,
        label: label === undefined ? "~" : label,
        wpm: wpm === undefined ? 0 : wpm,
        tid: tid === undefined ? global_tid++ : tid
    }
}

const timingToString = function(timing) {
    return timing.is_on + "\t"
        + timing.duration.toFixed(2)
        + "\t" + (timing.stype === undefined ? "~" :  timing.stype)
        + "\t" + (timing.label === undefined ? "~" : timing.label)
        + "\t" + (timing.wpm === undefined ? "0" : timing.wpm)
        + "\t" + (timing.tid === undefined ? "-1" : timing.tid)
}