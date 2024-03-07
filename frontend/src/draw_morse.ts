"use strict"
// Graphically draw a Morse code signal on a canvas
// By Braddock Gaskill, March 2024

const create_canvas = function (element) {
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth
    canvas.height = 100
    element.appendChild(canvas)
    return canvas
}

/* Draws a list of symbols on a canvas.  Each symbol is a dictionary of the form:
    {dt: duration, on: true/false}
 */
const draw_morse = function(canvas, symbols) {
    const ctx = canvas.getContext("2d");
    const draw = function (t, dt, on, label, xscale) {
        ctx.fillStyle = on ? "green" : "black";
        if (label !== "~") {
            ctx.fillStyle = "blue";
        }
        ctx.fillRect(t * xscale, 0, dt * xscale, 100);
        if (label !== "~" && label !== undefined) {
            ctx.fillStyle = "black";
            ctx.font = "60px Arial";
            ctx.fillText(label, t * xscale + 10, 50);
        }
    }
    let total_time = 0
    for (const sym of symbols) {
        total_time += sym.duration
    }
    let t = 0
    for (const sym of symbols) {
        draw(t, sym.duration, sym.is_on === "ON", sym.label, window.innerWidth / total_time)
        t += sym.duration
    }
}