import {TimingBuffer} from "./timing";
import {AudioSubsystem, Oscillator} from "./audio";
import {action, autorun, observable} from "mobx";

export class TimingsSounder {
    public readonly timingBuffer: TimingBuffer
    private readonly oscillator: Oscillator
    private readonly played: Set<number> = new Set()
    @observable accessor bufferEmpty: boolean = true

    constructor(timingBuffer: TimingBuffer, audioSubsystem: AudioSubsystem, frequency: number = 300) {
        this.timingBuffer = timingBuffer
        this.oscillator = audioSubsystem.createOscillator(frequency)

        autorun(() => {
            this.play_next()
        })
    }

    public play_next() {
        console.log("TimingsSounder: play_next")
        // We check for length just so mobx will notify us when the length changes
        if (this.timingBuffer.length === 0) {
            console.log("TimingsSounder: buffer empty")
            this.setBufferEmpty(true)
            return
        }
        for (const t of this.timingBuffer.timings) {
            if (!this.played.has(t.tid)) {
                if (t.is_on) {
                    this.oscillator.turnOn()
                } else {
                    this.oscillator.turnOff()
                }
                setTimeout(this.play_next.bind(this), t.duration)
                this.played.add(t.tid)
                return
            }
        }
        console.log("TimingsSounder: buffer empty")
        this.setBufferEmpty(true)
    }

    @action
    setBufferEmpty(value: boolean) {
        this.bufferEmpty = value
    }
}
