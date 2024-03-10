import {EasySocket} from "./easy_socket";
import {Timing, TimingBuffer, timingToString} from "./timing";
import {autorun} from "mobx";

export class Recognizer {
    easysocket: EasySocket
    timingBuffer: TimingBuffer
    lastDuration: number = -1
    lsatTid: number = -1

    constructor(uri: string, timingBuffer: TimingBuffer) {
        console.log("Recognizer Constructor")
        this.timingBuffer = timingBuffer
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
        const outputs = json as Timing[]
        const msg = outputs.slice(-1)[0]
        if (msg === undefined) {
            return
        }
        // console.log(msg)
        const t = this.timingBuffer?.getById(msg.tid)
        if (t) t.setLabel(msg.label)
    }
}