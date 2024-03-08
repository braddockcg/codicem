import {AudioSubsystem} from "./audio.js";
import {Reader} from "./reader.js";
import {create_canvas, draw_morse} from "./draw_morse.js";
import {nnmorse} from "./nnmorse.js";
import {Timing} from "./timing.js";

export class App {
    constructor() {
        console.log("App Constructor")
    }

    public init() {
        console.log("App init")


        const audioSubsystem = new AudioSubsystem()
        const canvasElement = document.getElementById('drawing')
        const canvas = create_canvas(document.getElementById('drawing'))

        const reader = Reader("ws://127.0.0.1:8765/send_morse_timings", "2M-test", 0, audioSubsystem)
        const reader_canvas = create_canvas(document.getElementById('reader_draw'))
        reader.onSymbols(function (symbols: Timing[]) {
            draw_morse(reader_canvas, symbols);
        })
        let text = ''
        reader.onResult(function (timing: Timing) {
            if (timing.label !== '~') {
                text += timing.label
                text = text.slice(-10)
                const ele = document.getElementById('reader_text')
                if (ele !== null) {
                    ele.innerHTML = text
                }
            }
        })
        nnmorse.init(audioSubsystem)

        // NNMorse Hooks
        document.addEventListener('keydown', (ev: KeyboardEvent) => nnmorse.keydown());
        document.addEventListener('keyup', (ev: KeyboardEvent) => nnmorse.keyup());
        document.addEventListener('mousedown', (ev: MouseEvent) => nnmorse.keydown());
        document.addEventListener('mouseup', (ev: MouseEvent) => nnmorse.keyup());

        // Needed when the window loses focus
        onblur = nnmorse.keyup;
        nnmorse.onResult(function (symbols) {
            let text = ''
            for (const s of symbols) {
                if (s.label !== '~' && s.label !== undefined) {
                    text += s.label
                }
            }
            const eles = document.getElementsByClassName('numbers')
            for (let i = 0; i < eles.length; i++) {
                eles[i].innerHTML = text
            }
        });
        nnmorse.onSymbols(function (symbols) {
            draw_morse(canvas, symbols);
        });

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