import {readTimingsSet} from 'tsapps/read_timings'

export async function main() {
    console.log("Reading...")
    const timingsSet = await readTimingsSet("/home/braddock/expire/morse/new-test")
    console.log("Read ", timingsSet.length, " Timings")
}

main()
    .then(() => console.log("Done."))
    .catch(err => console.error("Error:", err))