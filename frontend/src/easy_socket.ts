export class EasySocket {
    uri: string
    ws: WebSocket | null = null
    terminated: boolean = false

    // Users can set these callbacks
    onMessageCallback: ((event: MessageEvent) => void) | undefined
    onCloseCallback: ((event: CloseEvent) => void) | undefined
    onErrorCallback: ((event: Event) => void) | undefined
    onOpenCallback: ((event: Event) => void) | undefined
    onJSONMessage: ((message: object) => void) | undefined
    onTextMessage: ((message: string) => void) | undefined

    constructor(uri: string) {
        this.uri = uri
        this.init()
        this.periodicHandler()
    }

    private init() {
        this.ws = new WebSocket(this.uri)
        this.ws.onmessage = this.messageHandler
        this.ws.onclose = this.closeHandler
        this.ws.onerror = this.errorHandler
        this.ws.onopen = this.openHandler
    }

    send(message: string): boolean {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message)
            return true
        }
        return false
    }

    sendJSON(message: object): boolean {
        return this.send(JSON.stringify(message))
    }

    terminate() {
        this.terminated = true
        if (this.ws !== null) {
            this.ws.close()
        }
    }

    private messageHandler(msg: MessageEvent) {
        if (this.onJSONMessage) {
            this.onJSONMessage(JSON.parse(msg.data))
        }
        if (this.onTextMessage) {
            this.onTextMessage(msg.data)
        }
    }

    private closeHandler(event: CloseEvent) {
        console.log("EasySocket Close: ", event, " uri: ", this.uri)
        if (this.onCloseCallback) {
            this.onCloseCallback(event)
        }
    }

    private errorHandler(event: Event) {
        console.log("EasySocket Error: ", event, " uri: ", this.uri)
        if (this.onErrorCallback) {
            this.onErrorCallback(event)
        }
    }

    private openHandler(event: Event) {
        console.log("EasySocket Open: ", event, " uri: ", this.uri)
        if (this.onOpenCallback) {
            this.onOpenCallback(event)
        }
    }

    private periodicHandler() {
        if (this.terminated || this.ws === null) {
            return
        }
        if (this.ws.readyState === WebSocket.CLOSED) {
            console.log("Reconnecting to {this.uri}")
            this.init()
        }
        setTimeout(this.periodicHandler, 1000)
    }
}