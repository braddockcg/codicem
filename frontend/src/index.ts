import {App} from './app'

document.addEventListener('DOMContentLoaded', function () {
    const startup = function () {
        document.removeEventListener('mousedown', startup, false)
        document.removeEventListener('keydown', startup, false)
        const app = new App()
        app.init()
    }
    document.addEventListener('mousedown', startup, false)
    document.addEventListener('keydown', startup, false)
})