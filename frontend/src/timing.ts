import {observable, computed, action} from 'mobx'
import {getRandomInt} from "./util"

let global_tid = getRandomInt(10000000)

export class Timing {
    @observable accessor is_on: boolean
    @observable accessor duration: number
    @observable accessor stype: string
    @observable accessor label: string
    @observable accessor wpm: number
    @observable accessor tid: number

    constructor(is_on: boolean, duration: number, stype: string = '?', label: string = '~', wpm: number = 0, tid: number = -1) {
        this.is_on = is_on
        this.duration = duration
        this.stype = stype
        this.label = label
        this.wpm = wpm
        this.tid = tid === -1 ? global_tid++ : tid
    }

    @action
    addDuration(dt: number) {
        this.duration += dt
    }

    @action
    setLabel(label: string) {
        this.label = label
    }
}

export const timingToString = function(timing: Timing) {
    return (timing.is_on ? 'ON' : 'OFF') + "\t"
        + timing.duration.toFixed(2)
        + "\t" + (timing.stype === undefined ? "?" :  timing.stype)
        + "\t" + (timing.label === undefined ? "~" : timing.label)
        + "\t" + (timing.wpm === undefined ? "0" : timing.wpm)
        + "\t" + (timing.tid === undefined ? "-1" : timing.tid)
}

export const timingFromJson = function(json: any) {
    const s = JSON.parse(json)
    return new Timing(s.is_on, s.duration, s.stype, s.label, s.wpm, s.tid)
}

export class TimingBuffer {
    @observable accessor timings: Timing[] = []
    @observable accessor capacity: number

    constructor(capacity: number = -1) {
        this.capacity = capacity
    }

    @action
    private truncate() {
        if (this.capacity === -1) {
            return
        }
        while (this.timings.length > this.capacity) {
            this.timings.shift()
        }
    }
    @action
    push(timing: Timing) {
        this.timings.push(timing)
        this.truncate()
    }

    @action
    shift(): Timing {
        return this.timings.shift()!
    }

    @action
    removeTiming(timing: Timing) {
        for (const t of this.timings) {
            if (t === timing) {
                this.timings.splice(this.timings.indexOf(t), 1)
                return
            }
        }
    }

    @action
    setTimings(timings: Timing[]) {
        this.timings = timings
        // this.timings.splice(0)
        // this.timings.concat(timings)
        // this.truncate()
    }

    @computed
    get toString() {
        return this.timings.map(timingToString).join("\n")
    }

    @computed
    get last(): Timing | undefined {
        return this.timings[this.timings.length - 1]
    }

    @computed
    get labels() : string {
        const labels = this.timings.filter(e => (e.label !== '~')).map(t => t.label)
        return labels.join('')
    }

    getById(tid: number): Timing | undefined {
        return this.timings.filter(t => t.tid === tid)[0]
    }

    @computed
    get length(): number {
        console.log("TimingBuffer: length")
        if (this.timings) {
            console.log("TimingBuffer: timings not null")
        }
        return this.timings.length
    }
}