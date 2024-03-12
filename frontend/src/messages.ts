import {getRandomInt} from "./util";
import {Timing} from "./timing";

let next_message_id = getRandomInt(10000000)
function get_message_id() {
    return next_message_id++
}

export class Message {
    public readonly mid: number = get_message_id()
    public readonly message_type: string = "Message"
}

export class TimingsMessage extends Message {
    public readonly message_type: string = "TimingsMessage"
    public readonly timings: Timing[]

    constructor(timings: Timing[]) {
        super()
        this.timings = timings
    }
}


export class Recognition {
    public readonly tid: number
    public readonly label: string

    constructor (tid: number, label: string) {
        this.tid = tid
        this.label = label
    }
}

export class RecogResults extends Message{
    readonly recognitions: Recognition[]
    readonly normalized: Timing[]

    constructor(recognitions: Timing[], normalized: Timing[]) {
        super()
        this.recognitions = recognitions
        this.normalized = normalized
    }
}

export class Envelope {
    public readonly message_type: string = "Envelope"
    public readonly payload: Message

    constructor(payload: Message) {
        this.payload = payload
        this.message_type = payload.message_type
    }
}

export function unpack_json_message(msg: string): Envelope {
    const envelope = JSON.parse(msg) as Envelope
    return envelope
}

export function pack_json_message(msg: Message): string {
    return JSON.stringify(new Envelope(msg))
}