import {getRandomInt} from "./util"

let global_tid = getRandomInt(10000000)
export const createTiming = function(
    is_on: boolean,
    duration: number,
    stype: string = '',
    label: string = '~',
    wpm: number = 0,
    tid: number = undefined,
) {
    return {
        is_on: is_on,
        duration: duration,
        stype: stype,
        label: label,
        wpm: wpm,
        tid: tid === undefined ? global_tid++ : tid
    }
}

export const timingToString = function(timing) {
    return timing.is_on + "\t"
        + timing.duration.toFixed(2)
        + "\t" + (timing.stype === undefined ? "~" :  timing.stype)
        + "\t" + (timing.label === undefined ? "~" : timing.label)
        + "\t" + (timing.wpm === undefined ? "0" : timing.wpm)
        + "\t" + (timing.tid === undefined ? "-1" : timing.tid)
}