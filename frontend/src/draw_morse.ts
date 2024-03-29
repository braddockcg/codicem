// Graphically draw a Morse code signal on a canvas
// By Braddock Gaskill, March 2024

import {Timing, TimingBuffer, timingToString} from "./timing";
import {autorun} from "mobx";

export const create_canvas = function (element: HTMLElement | null) {
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth
    canvas.height = 100
    if (element) {
        element.appendChild(canvas)
    }
    return canvas
}

/* Draws a list of symbols on a canvas.  Each symbol is a dictionary of the form:
    {dt: duration, on: true/false}
 */
export const draw_morse = function(canvas: any, symbols: Timing[]) {
    const maxDuration = 1000
    const ctx = canvas.getContext("2d");

    const draw = function (t: number, dt:number, on: boolean, label: string, xscale: number) {
        ctx.fillStyle = on ? "green" : "gray";
        let height = 100
        if (dt === maxDuration) {
            ctx.fillStyle = "black";
            height = 30
        }
        // if (label !== "~") {
        //     ctx.fillStyle = "blue";
        // }
        ctx.fillRect(t * xscale, (50 - height/2), dt * xscale, height);
        if (label !== "~" && label !== undefined) {
            ctx.fillStyle = "red";
            ctx.font = "60px Arial";
            ctx.fillText(label, t * xscale + 10, 50);
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let total_time = 0
    for (const sym of symbols) {
        total_time += Math.min(sym.duration, maxDuration)
    }
    let t = 0
    // console.log("DRAW------------------------------")
    for (const sym of symbols) {
        // console.log("DRAW: ", t, " : ", timingToString(sym))
        let label = sym.label
        const d = Math.min(sym.duration, maxDuration)
        draw(t, d, sym.is_on, label, window.innerWidth / total_time)
        t += d
    }
}

export class TimingsRenderer {
    canvas: HTMLCanvasElement
    timingBuffer: TimingBuffer

    constructor(element: HTMLElement, timingBuffer: TimingBuffer) {
        this.canvas = create_canvas(element)
        this.timingBuffer = timingBuffer

        autorun(() => {
            this.draw()
        })
    }

    public draw() {
        draw_morse(this.canvas, this.timingBuffer.timings)
    }
}