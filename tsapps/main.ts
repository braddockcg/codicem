// This program uses morse-pro to decode a Codicem timings file
// used for training or evaluation.  It was written to compare
// the morse-pro heuristics to my neural network performance.
// We get generally poor results.
// by Braddock Gaskill, March 2024

import {readTimingsSet, timingsLabel} from 'tsapps/read_timings'
import MorseAdaptiveDecoder from '@morsepro/morse-pro-decoder-adaptive'

export async function main() {
    if (process.argv.length !== 3) {
        console.log(`USAGE: npx ${process.argv[0]} ${process.argv[1]} [timings_filename]`)
        process.exit()
    }    
    const fname = process.argv[2]
    console.log(`Reading ${fname}...`)
    const timingsSet = await readTimingsSet(fname)
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
            // console.log("wpm: " + data.wpm)
        }

        const wpms: number[] = []
        for (const timing of timings) {
            wpms.push(timing.wpm)
        }
        const wpm = Math.min(...wpms)
        const fwpm = Math.max(...wpms)
        // console.log("TIMING wpm: ", wpm, " fwpm: ", fwpm)

        const decoder = new MorseAdaptiveDecoder(
            {
                messageCallback,
                speedCallback,
                dictionaryOptions: [],
                wpm,
                fwpm,
            })

        for (const timing of timings) {
            let duration = timing.duration
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
