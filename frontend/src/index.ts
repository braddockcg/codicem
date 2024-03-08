import {App} from './app'
let app: App | null = null

document.addEventListener('DOMContentLoaded', function () {
    const startup = function () {
        if (app === null) {
            app = new App()
            app.init()
        }
        document.removeEventListener('mousedown', startup)
        document.removeEventListener('keydown', startup)
    }
    document.addEventListener('mousedown', startup)
    document.addEventListener('keydown', startup)
})