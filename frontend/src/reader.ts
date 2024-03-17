// Read a Morse code signal from the server, sound it and draw it on a canvas

import {Timing, TimingBuffer} from "./timing";
import {AudioSubsystem} from "./audio";
import {EasySocket, EasySocketParams} from "./easy_socket";
import {autorun} from "mobx";
import {TimingsSounder} from "./timings_sounder";


export class Reader {
    readonly pending: TimingBuffer = new TimingBuffer(24)
    paused = true
    readonly easysocket: EasySocket
    readonly timingsSounder: TimingsSounder
    readonly wpm: number
    readonly filename: string

    constructor(uri: EasySocketParams, filename: string, wpm: number, audioSubsystem: AudioSubsystem, frequency: number = 300) {
        this.wpm = wpm
        this.filename = filename
        this.timingsSounder = new TimingsSounder(this.pending, audioSubsystem, frequency)
        this.easysocket = new EasySocket(uri)
        this.easysocket.onOpen = (event) => {
            console.log("Reader Connection opened");
            this.send()
        }
        this.easysocket.onJSONMessage = (obj) => {
            const timings = obj as Timing[]
            console.log("Reader got message with ", timings.length, " timings")

            this.pending.setTimings(timings)
            this.timingsSounder.setBufferEmpty(false)
        }

        autorun(() => {
            if (this.timingsSounder.bufferEmpty) {
                this.send()
                this.timingsSounder.setBufferEmpty(false)
            }
        })
    }

    send() {
        console.log("Reader sending")
        this.easysocket.sendJSON({
            "wpm": this.wpm,
            "filename": this.filename,
        })
    }
}
