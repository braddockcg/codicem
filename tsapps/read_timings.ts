import {Timing, stringToTiming, timingToString} from '@codicem/timing'
import * as readline from "readline";
import * as fs from "fs";

export function timingsLabel(timings: Timing[]) : string {
    const labels = timings.filter(e => (e.label !== '~')).map(t => t.label)
    return labels.join('')
}

export async function* readLinesFromFile(filePath: string): AsyncGenerator<string> {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        yield line;
    }
}

export const readTimingsSet = async (filename: string): Promise<Timing[][]> => {
    const timings_set: Timing[][] = [];
    let timings: Timing[] = [];
    console.log("filename:", filename)
    for await (const line of readLinesFromFile(filename)) {
        const split = line.split("\t")
        if (split[0] === "END") {
            timings_set.push(timings);
            timings = [];
        } else if (split[0] === "ON" || split[0] === "OFF") {
            const timing = stringToTiming(line)
            timings.push(timing);
        }
    }
    return timings_set;
}