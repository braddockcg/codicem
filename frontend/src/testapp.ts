// A simple test to meaure input latency and performance
// By Braddock Gaskill, March 2024

export class TestApp {
    html() {
        return `
        <div id="test">
            <h2 style="color: lightgray">Input Latency Test</h2>
            <div id="test_draw"></div>
        </div>
        `
    }

    black() {
        document.body.style.background = 'black'
    }

    white() {
        document.body.style.background = 'white'
    }

    constructor() {
        console.log("TestApp Constructor")
        const container = document.getElementById('container')
        if (!container) {
            console.log("ERROR: container not found")
            return
        }
        container.innerHTML = this.html()

        document.addEventListener('keydown', (ev: KeyboardEvent) => this.white());
        document.addEventListener('keyup', (ev: KeyboardEvent) => this.black());
        document.addEventListener('mousedown', (ev: MouseEvent) => this.white());
        document.addEventListener('mouseup', (ev: MouseEvent) => this.black());
        onblur = this.black.bind(this)

    }
}