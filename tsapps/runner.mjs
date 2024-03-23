import MorseCW from 'morse-pro-cw.js';
import MorseMessage from './morse-pro-message.js';
import MorseCWWave from './morse-pro-cw-wave.js';

var morseCW = new MorseCW();
let morseCWWave = new MorseCWWave();
let morseMessage = new MorseMessage(morseCWWave);
let output;
try {
    output = morseMessage.translate("abc");
    console.log(output)
} catch (ex) {
    console.log("Error in input: " + '[' + "abc" + ']');
}

console.log("Hello World!")

