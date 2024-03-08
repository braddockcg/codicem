import {AudioSubsystem} from "./audio";
import {Reader} from "./reader";
import {create_canvas, draw_morse} from "./draw_morse";
import {nnmorse} from "./nnmorse";
import {Timing, TimingBuffer, timingToString} from "./timing";
import {autorun} from "mobx";
import {KeyTimer} from "./keytimer";
import {Recognizer} from "./recognizer";

export class App {
    constructor() {
        console.log("App Constructor")
    }

    public init() {
        console.log("App init")

        const audioSubsystem = new AudioSubsystem()
        const nnmorse_canvas = create_canvas(document.getElementById('nnmorse_draw'))

        const reader = Reader("ws://127.0.0.1:8765/send_morse_timings", "2M-test", 0, audioSubsystem)
        const reader_canvas = create_canvas(document.getElementById('reader_draw'))
        autorun(() => {
            draw_morse(reader_canvas, reader.symbols.timings)
            const ele = document.getElementById('reader_text')
            if (ele !== null) {
                ele.innerHTML = reader.symbols.labels
            }
        })

        // KeyTimer setup
        const timingBuffer = new TimingBuffer(48)
        const keyTimer = new KeyTimer(timingBuffer)

        autorun(() => {
            console.log("KeyTimer: " + timingToString(keyTimer.timing))
        })

        document.addEventListener('keydown', (ev: KeyboardEvent) => keyTimer.keydown());
        document.addEventListener('keyup', (ev: KeyboardEvent) => keyTimer.keyup());
        document.addEventListener('mousedown', (ev: MouseEvent) => keyTimer.keydown());
        document.addEventListener('mouseup', (ev: MouseEvent) => keyTimer.keyup());
        onblur = keyTimer.keyup

        const recognizer = new Recognizer("ws://127.0.0.1:8765/decode_morse", timingBuffer)

        // nnmorse.init(audioSubsystem)

        // NNMorse HtimingBufferooks
        // document.addEventListener('keydown', (ev: KeyboardEvent) => nnmorse.keydown());
        // document.addEventListener('keyup', (ev: KeyboardEvent) => nnmorse.keyup());
        // document.addEventListener('mousedown', (ev: MouseEvent) => nnmorse.keydown());
        // document.addEventListener('mouseup', (ev: MouseEvent) => nnmorse.keyup());
        //
        // // Needed when the window loses focus
        // onblur = nnmorse.keyup;
        autorun(() => {
             draw_morse(nnmorse_canvas, timingBuffer.timings)
             const ele = document.getElementById('nnmorse_text')
             if (ele !== null) {
                 ele.innerHTML = timingBuffer.labels
             }
        })

// LCWO Hooks
        /*
        window.keydown(down);
        window.keyup(up);
        window.mousedown(down);
        window.mouseup(up);
        */

// Gamepad support
        window.addEventListener("gamepadconnected", function (e) {
            var gp = navigator.getGamepads()[0];
            if (gp) {
                console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
                    gp.index, gp.id,
                    gp.buttons.length, gp.axes.length);
            }
        });

        const gameLoop = function () {
            if (navigator.getGamepads().length === 0) {
                return
            }
            let gamepad = navigator.getGamepads()[0];
            if (gamepad) {
                if (gamepad.buttons[0].pressed) {
                    nnmorse.keydown();
                } else {
                    nnmorse.keyup();
                }
            }
            requestAnimationFrame(gameLoop);
        }
        requestAnimationFrame(gameLoop);


    }
}