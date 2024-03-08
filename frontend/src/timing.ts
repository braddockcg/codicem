import {getRandomInt} from "./util.js"

let global_tid = getRandomInt(10000000)

export class Timing {
    is_on: boolean
    duration: number
    stype: string
    label: string
    wpm: number
    tid: number

    constructor(is_on: boolean, duration: number, stype: string = '', label: string = '~', wpm: number = 0, tid: number = -1) {
        this.is_on = is_on
        this.duration = duration
        this.stype = stype
        this.label = label
        this.wpm = wpm
        this.tid = tid === -1 ? global_tid++ : tid
    }
}

export const timingToString = function(timing: Timing) {
    return (timing.is_on ? 'ON' : 'OFF') + "\t"
        + timing.duration.toFixed(2)
        + "\t" + (timing.stype === undefined ? "~" :  timing.stype)
        + "\t" + (timing.label === undefined ? "~" : timing.label)
        + "\t" + (timing.wpm === undefined ? "0" : timing.wpm)
        + "\t" + (timing.tid === undefined ? "-1" : timing.tid)
}

export const timingFromJson = function(json: any) {
    const s = JSON.parse(json)
    return new Timing(s.is_on, s.duration, s.stype, s.label, s.wpm, s.tid)
}