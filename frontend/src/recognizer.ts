import {EasySocket} from "./easy_socket";
import {Timing, TimingBuffer, timingToString} from "./timing";
import {autorun} from "mobx";

export class Recognizer {
    easysocket: EasySocket | null = null
    timingBuffer: TimingBuffer | null = null

    constructor(uri: string, timingBuffer: TimingBuffer) {
        console.log("Recognizer Constructor")
        this.timingBuffer = timingBuffer
        this.easysocket = new EasySocket(uri);
        this.easysocket.onJSONMessage = this.onMessage.bind(this)
        autorun(() => {
            if (this.timingBuffer) {
                const last = this.timingBuffer.last
                if (last !== undefined) {
                    this.easysocket?.send(timingToString(last))
                }
            }
        })
    }

    private onMessage(json: object) {
        const outputs = json as Timing[]
        const msg = outputs.slice(-1)[0]
        if (msg === undefined) {
            return
        }
        const t = this.timingBuffer?.getById(msg.tid)
        if (t) t.label = msg.label
    }
}