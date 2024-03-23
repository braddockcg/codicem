import {readTimingsSet, timingsLabel} from 'tsapps/read_timings'
import MorseAdaptiveDecoder from '@morsepro/morse-pro-decoder-adaptive'

export async function main() {
    console.log("Reading...")
    const timingsSet = await readTimingsSet("/home/braddock/expire/morse/new-test")
    console.log("Read ", timingsSet.length, " Timings")

    // for (const timings of timingsSet) {
    //     console.log(timingsLabel(timings))
    // }

    for (const timings of timingsSet) {
        let total = 0
        for (const timing of timings) {
            total += timing.duration
        }
        const mean = total / timings.length
        console.log("Mean: ", mean)

        let message = ''
        const messageCallback = function(data: any) {
            // console.log("Decoded: {\n  timings: " + data.timings
            //     + "\n  morse: " + data.morse
            //     + "\n  message: " + data.message
            //     + "\n}"
            // )
            message = message + data.message
        }

        const speedCallback = function(data: any) {
            console.log("wpm: " + data.wpm)
        }

        const decoder = new MorseAdaptiveDecoder(
            {
                messageCallback,
                speedCallback,
                dictionaryOptions: [],
                wpm: 20,
                fwpm: 20,
            })

        for (const timing of timings) {
            let duration = timing.duration * 100
            duration = timing.is_on ? duration : -duration
            decoder.addTiming(duration)
        }
        decoder.flush()
        console.log("Codicem: ", timingsLabel(timings), " MorsePro: ", message)
    }
}

main()
    .then(() => console.log("Done."))
    .catch(err => console.error("Error:", err))