export class EasySocket {
    uri: string
    ws: WebSocket | null = null
    terminated: boolean = false

    // Users can set these callbacks
    onMessage: ((event: MessageEvent) => void) | undefined
    onClose: ((event: CloseEvent) => void) | undefined
    onError: ((event: Event) => void) | undefined
    onOpen: ((event: Event) => void) | undefined
    onJSONMessage: ((message: object | object[]) => void) | undefined
    onTextMessage: ((message: string) => void) | undefined

    constructor(uri: string) {
        this.uri = uri
        this.init()
        this.periodicHandler()
    }

    private init() {
        this.ws = new WebSocket(this.uri)
        this.ws.onmessage = this.messageHandler.bind(this)
        this.ws.onclose = this.closeHandler.bind(this)
        this.ws.onerror = this.errorHandler.bind(this)
        this.ws.onopen = this.openHandler.bind(this)
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
        if (this.onClose) {
            this.onClose(event)
        }
    }

    private errorHandler(event: Event) {
        console.log("EasySocket Error: ", event, " uri: ", this.uri)
        if (this.onError) {
            this.onError(event)
        }
    }

    private openHandler(event: Event) {
        console.log("EasySocket Open: ", event, " uri: ", this.uri)
        if (this.onOpen) {
            this.onOpen(event)
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
        setTimeout(this.periodicHandler.bind(this), 1000)
    }
}