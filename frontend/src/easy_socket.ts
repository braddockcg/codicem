export interface EasySocketParams {
    protocol?: string
    host?: string
    port: number
    path?: string
}


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

    /* If just a number is passed as uri, then it is assumed to be a port number
    * and the host will be the same host as the web server location the page
    * was loaded from.  Otherwise uri should be a well formed ws:// or wss:// uri */
    constructor(p: EasySocketParams) {
        p.protocol = p.protocol ?? (location.protocol === 'https:' ? 'wss:' : 'ws:');
        p.host = p.host ?? location.hostname;
        if (p.port === undefined) {
            throw new Error("port must be defined")
        }
        this.uri = `${p.protocol}//${p.host}:${p.port}${p.path}`
        this.init()
        this.periodicHandler()
    }

    private init() {
        console.log("EasySocket init: ", this.uri)
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