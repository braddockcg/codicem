// Utility functions for morse code project
// By Braddock Gaskill, March 2024

export const AudioSubsystem = function() {
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