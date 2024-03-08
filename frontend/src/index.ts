import {App} from './app'
import {TestApp} from './testapp'

document.addEventListener('DOMContentLoaded', function () {
    const startup = function () {
        if (document.location.search === '?test') {
            console.log("Running tests")
            const app = new TestApp()
        } else {
            const app = new App()
            app.init()
        }

        document.removeEventListener('mousedown', startup)
        document.removeEventListener('keydown', startup)
    }
    document.addEventListener('mousedown', startup)
    document.addEventListener('keydown', startup)
})