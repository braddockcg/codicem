import {AudioSubsystem} from "./audio";
import {Reader} from "./reader";
import {create_canvas, draw_morse, TimingsRenderer} from "./draw_morse";
import {Timing, TimingBuffer, timingToString} from "./timing";
import {autorun} from "mobx";
import {KeyTimer} from "./keytimer";
import {Recognizer} from "./recognizer";
import {setBackgroundColor} from "./util";
import * as lcwo from './lcwo';

export class App {
    readonly audioSubsystem: AudioSubsystem = new AudioSubsystem()
    // KeyTimer setup
    readonly timingBuffer = new TimingBuffer(24)
    readonly keyTimer: KeyTimer

    constructor() {
        console.log("App Constructor")
        this.keyTimer = new KeyTimer(this.timingBuffer)
    }

    public html() {
        return `
        <div id="nnmorse">
            <h2>Recognizer</h2>
            <div id="nnmorse_draw"></div>
            <div id="nnmorse_text"></div>
        </div>
        <div id="normalized">
            <h2>Normalized</h2>
            <div id="normalized_draw"></div>
        </div>
        <div id="reader">
            <h2>Reader</h2>
            <div id="reader_draw"></div>
            <div id="reader_text"></div>
        </div>
        `
    }

    private init_html() {
        const container = document.getElementById('container')
        if (!container) {
            console.log("ERROR: container not found")
            return
        }
        container.innerHTML = this.html()
    }

    private init_reader() {
        const reader = new Reader(
            "ws://127.0.0.1:8765/send_morse_timings",
            "2M-test",
            10,
            this.audioSubsystem
        )
        const reader_canvas = create_canvas(document.getElementById('reader_draw'))
        autorun(() => {
            draw_morse(reader_canvas, reader.pending.timings)
            const ele = document.getElementById('reader_text')
            if (ele !== null) {
                ele.innerHTML = reader.pending.labels
            }
        })
    }

    init_keytimer() {
        autorun(() => {
            // console.log("KeyTimer: " + timingToString(keyTimer.timing))
            setBackgroundColor(this.keyTimer.timing.is_on ? "lightgray" : "darkgray")
        })

        document.addEventListener('keydown',
            (ev: KeyboardEvent) => {if (!ev.repeat) this.keyTimer.keydown()});
        document.addEventListener('keyup',
            (ev: KeyboardEvent) => {if (!ev.repeat) this.keyTimer.keyup()});
        document.addEventListener('mousedown', (ev: MouseEvent) => this.keyTimer.keydown());
        document.addEventListener('mouseup', (ev: MouseEvent) => this.keyTimer.keyup());
        onblur = () => this.keyTimer.keyup()
    }
    
    init_recog() {
        const recognizer = new Recognizer("ws://127.0.0.1:8765/decode_morse", this.timingBuffer)
        const nnmorse_draw_ele = document.getElementById('nnmorse_draw')
        if (nnmorse_draw_ele) {
            const recognizerRenderer = new TimingsRenderer(nnmorse_draw_ele, this.timingBuffer)
        }
        const norm_draw_ele = document.getElementById('normalized_draw')
        if (norm_draw_ele) {
            const normalizedRenderer = new TimingsRenderer(norm_draw_ele, recognizer.normalizedTimingBuffer)
        } else {
            console.log("ERROR could not find normalized_draw element")
        }
        autorun(() => {
            const ele = document.getElementById('nnmorse_text')
            if (ele !== null) {
                ele.innerHTML = this.timingBuffer.labels
            }
        })
    }

    init_gamepad() {
        // Gamepad support
        window.addEventListener("gamepadconnected", function (e) {
            const gp = navigator.getGamepads()[0];
            if (gp) {
                console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
                    gp.index, gp.id,
                    gp.buttons.length, gp.axes.length);
            }
        });

        const gameLoop = () => {
            if (navigator.getGamepads().length === 0) {
                return
            }
            const gamepad = navigator.getGamepads()[0];
            if (gamepad) {
                if (gamepad.buttons[0].pressed) {
                    this.keyTimer.keydown();
                } else {
                    this.keyTimer.keyup();
                }
            }
            requestAnimationFrame(gameLoop);
        }
        requestAnimationFrame(gameLoop);
    }

    /* This is for the morse code decoder from lcwo.net.
    * It adds text to the HTML id element 'jskey' and 'speed' */
    init_lcwo() {
        document.addEventListener('keydown',
            lcwo.down);
        document.addEventListener('keyup',
            lcwo.up);
        document.addEventListener('mousedown',
            lcwo.down);
        document.addEventListener('mouseup',
            lcwo.up);
        onblur = lcwo.up
    }

    public init() {
        console.log("App init")
        // resume must be called after first user input
        this.audioSubsystem.audioContext.resume()

        // set up the HTML
        this.init_html()

        this.init_keytimer()

        // set up the reader
        // this.init_reader()

        // set up the recognition component
        this.init_recog()

        this.init_gamepad()

        this.init_lcwo() // optional for comparison with lcwo.net
    }
}