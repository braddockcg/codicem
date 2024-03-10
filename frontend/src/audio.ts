// Utility functions for morse code project
// By Braddock Gaskill, March 2024

export class AudioSubsystem {
    audioContext : AudioContext

    constructor() {
        console.log("AudioSubsystem Constructor")
        this.audioContext = new AudioContext();
    }
    public createOscillator(freq: number) {
        const osc = this.audioContext.createOscillator();
        osc.frequency.value = freq;
        osc.type = 'sine';

        const lpf = this.audioContext.createBiquadFilter();
        lpf.type = "lowpass";
        lpf.frequency.value = 800;
        osc.connect(lpf)

        const gain = this.audioContext.createGain();
        gain.gain.value = 0;
        lpf.connect(gain);
        gain.connect(this.audioContext.destination);

        const oscillator = new Oscillator(this, osc, gain)
        oscillator.setGain(0.0)
        osc.start()
        return oscillator;
    }


    time() { return this.audioContext.currentTime }
}

export class Oscillator {
    public audioSubsystem: AudioSubsystem
    public osc: OscillatorNode
    public gain: GainNode

    constructor(audioSubsystem: AudioSubsystem, osc: OscillatorNode, gain: GainNode) {
        this.audioSubsystem = audioSubsystem
        this.osc = osc
        this.gain = gain
    }

    public setGain(value: number) {
        // this.audioSubsystem.audioContext.resume()
        // this.gain.gain.value = value;
        const timeConstant = 0.030
        this.gain.gain.setTargetAtTime(value, this.audioSubsystem.time() + timeConstant, timeConstant)
    }

    public turnOn() {
        this.setGain(0.25)
    }

    public turnOff() {
        this.setGain(0.0)
    }

}