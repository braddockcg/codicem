// Read a Morse code signal from the server, sound it and draw it on a canvas

export const Reader = function(uri: string, filename: string, wpm: number, audioSubsystem) {
    const oscillator = audioSubsystem.createOscillator(300)
    let onSymbolsCallback
    let symbols = []
    let pending = []
    let nextTime = 0
    let onResultCallback

    const ws = new WebSocket(uri);

    const play_next = function() {
        // console.log("play_next queue size = " + pending.length, " nextTime = " + nextTime, " time = " + audioSubsystem.time())
        if (pending.length == 0 || audioSubsystem.time() < nextTime) {
            setInterval(play_next, 1000 * (nextTime - audioSubsystem.time()))
            return
        }
        const timing = pending.shift()
        if (onResultCallback) {
            onResultCallback(timing)
        }
        if (timing.is_on === "ON") {
            audioSubsystem.turnOnOscillator(oscillator)
        } else {
            audioSubsystem.turnOffOscillator(oscillator)
        }
        symbols.push(timing)
        symbols = symbols.slice(-30)
        if (onSymbolsCallback) {
            onSymbolsCallback(symbols)
        }
        nextTime = audioSubsystem.time() + timing.duration / 1000
        setInterval(play_next, timing.duration)
    }

    ws.onmessage = function(event) {
        console.log("Reader received: " + event.data)
        const timing = JSON.parse(event.data);
        timing.is_on = timing.is_on ? "ON" : "OFF"
        pending.push(timing)
        if (pending.length == 1) {
            play_next()
        }
    }

    ws.onclose = function(event) {
        console.log("Reader Connection closed");
    }

    ws.onerror = function(event) {
        console.log("Reader Connection error");
    }

    ws.onopen = function(event) {
        console.log("Reader Connection opened");
        ws.send(wpm + "\t" + filename)
    }

    return {
        onSymbols: function(callback) {
            onSymbolsCallback = callback
        },
        onResult: function(callback) {
            onResultCallback = callback
        }
    }
}
