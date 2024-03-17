import {EasySocket, EasySocketParams} from "./easy_socket";
import {Timing, TimingBuffer, timingToString} from "./timing";
import {autorun} from "mobx";
import {Envelope, RecogResults} from "./messages";


export class Recognizer {
    easysocket: EasySocket
    timingBuffer: TimingBuffer
    normalizedTimingBuffer: TimingBuffer
    lastDuration: number = -1
    lsatTid: number = -1

    constructor(uri: EasySocketParams, timingBuffer: TimingBuffer) {
        console.log("Recognizer Constructor")
        this.timingBuffer = timingBuffer
        this.normalizedTimingBuffer = new TimingBuffer()
        this.easysocket = new EasySocket(uri);
        this.easysocket.onJSONMessage = this.onMessage.bind(this)
        autorun(() => {
            const last = this.timingBuffer.last
            if (last !== undefined
                && (last.duration !== this.lastDuration || last.tid !== this.lsatTid)
                && last.duration > 6
            ) {
                this.lastDuration = last.duration
                this.lsatTid = last.tid
                this.easysocket?.send(timingToString(last))
                // console.log("Sent: " + timingToString(last))
            }
        })
    }

    private onMessage(json: object) {
        const envelope = json as Envelope
        const msg: RecogResults = envelope.payload as RecogResults
        const last_recognition = msg.recognitions.slice(-1)[0]
        if (msg === undefined) {
            return
        }
        console.log(last_recognition.label)
        const t = this.timingBuffer?.getById(last_recognition.tid)
        if (t) t.setLabel(last_recognition.label)
        this.normalizedTimingBuffer.setTimings(msg.normalized)
    }
}