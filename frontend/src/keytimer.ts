import {action, observable} from 'mobx'
import {Timing, TimingBuffer, timingToString} from "./timing";

export class KeyTimer {

    @observable accessor timing: Timing = new Timing(false, 0)
    timingBuffer: TimingBuffer | null = null
    timeout = 1000

    private lastEventTime: number = performance.now()

    constructor(timeBuffer: TimingBuffer | null = null) {
        this.timingBuffer = timeBuffer
        this.timeoutHandler()
    }

    public keydown() {
        console.log("keydown")
        this.update(false)
        this.update(true)
    }

    public keyup() {
        console.log("keyup")
        this.update(true)
        this.update(false)
    }

    @action
    private update(is_on: boolean) {
        const t = performance.now()
        const dt = t - this.lastEventTime
        this.lastEventTime = t
        if (is_on === this.timing.is_on) {
            this.timing.addDuration(dt)
        } else {
            this.timing = new Timing(is_on, dt)
        }
        this.addToBuffer()
    }

    private addToBuffer() {
        if (!this.timingBuffer) {
            return
        }
        if (this.timingBuffer.timings[this.timingBuffer.timings.length - 1] !== this.timing) {
            this.timingBuffer.push(this.timing)
        }
    }

    private timeoutHandler() {
        this.update(this.timing.is_on)
        setTimeout(this.timeoutHandler.bind(this), this.timeout)
    }
}