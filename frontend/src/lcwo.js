/* This is the morse code decoder from lcwo.net */

var time;
var temp;
var lastchar = "";
var dotlength = 150;
var avgdot = dotlength;
var avgdash = dotlength*3;
var idletime = new Date().getTime();
var keydown = 0;
var sent = 0;
var p = document.getElementById('player');
var queue = new Queue();

var code = new Array();
code['.-'] = "A"; code['-...'] = "B"; code['-.-.'] = "C";
code['-..'] = "D"; code['.'] = "E"; code['..-.'] = "F";
code['--.'] = "G"; code['....'] = "H"; code['..'] = "I";
code['.---'] = "J"; code['-.-'] = "K"; code['.-..'] = "L";
code['--'] = "M"; code['-.'] = "N"; code['---'] = "O";
code['.--.'] = "P"; code['--.-'] = "Q"; code['.-.'] = "R";
code['...'] = "S"; code['-'] = "T"; code['..-'] = "U";
code['...-'] = "V"; code['.--'] = "W"; code['-..-'] = "X";
code['-.--'] = "Y"; code['--..'] = "Z"; code['.----'] = "1";
code['..---'] = "2"; code['...--'] = "3"; code['....-'] = "4";
code['.....'] = "5"; code['-....'] = "6"; code['--...'] = "7";
code['---..'] = "8"; code['----.'] = "9"; code['-----'] = "0";
code['.-.-.-'] = "."; code['..--..'] = "?"; code['---...'] = ":";
code['-....-'] = "-"; code['-.--.-'] = ")"; code['-.--.'] = "(";
code['.-.-.'] = "+"; code['...-.-'] = "<u>SK</u>";
code['-.-.-'] = "<u>CT</u>"; code['.--.-.'] = "@";
code['-..-.'] = "/";
code['--..--'] = ",";

window.setInterval(checkspace, 5*dotlength);


function down () {
    time = new Date().getTime();
    //      queue.addspace(time-idletime);
    checkspace();
    keydown = 1;
    //p.play();
}


function up () {
    keydown = 0;
    //p.pause();
    time = new Date().getTime() - time;
    //      queue.addmark(time);
    if (time > dotlength) {
        element = "-";
        avgdash = (avgdash + time)/2;
    }
    else {
        element = ".";
        avgdot = (avgdot + time)/2;
    }
    lastchar += element;
    update();
    idletime = new Date().getTime();
}

function checkspace () {
    console.log("checkspace")
    if (keydown) { return; }
    var mytime = new Date().getTime();
    var diff = mytime-idletime;

    if (diff > 1000) {
        if (queue.getlength() > 0) {
            //  append(queue.purge(), 'log');
            submittext(queue.purge(), Math.round(effspeed));
        }
    }

    if (diff > 2*dotlength) {
        if (code[lastchar]) {
            append(code[lastchar], "jskey");
            queue.add(code[lastchar]);
        }
        else if (lastchar) {
            append("*", "jskey");
            queue.add('*');
        }
        lastchar = '';
        if (time-idletime > 4*dotlength) {
            append(" ", "jskey");
            queue.add(' ');
        }
    }
}

function append(what, where) {
    console.log("append", what, where);
    document.getElementById(where).innerHTML += what;
}

function changespeed (a) {
    if (a) {
        dotlength -= 5; 
    }
    else {
        dotlength += 5; 
    }
    update();
}

function update () {
    wpm = Math.round(10*1200/dotlength)/10;
    ratio = Math.round(10*avgdash / avgdot)/10;
    effspeed = Math.round(10*3600/avgdash)/10;
    var x = document.getElementById('speed');
    x.innerHTML = "Speed: "+wpm+"WpM";
    x.innerHTML += "; Ratio: " + ratio;
    x.innerHTML += "; eff. Speed: " + effspeed;
}

function Queue () {
    this.content = '';
    this.tmp = '';
    this.add = function (chr) {
        this.content += chr;
    }
    this.getlength = function () {
        return this.content.length;
    }
    this.purge = function () {
        this.tmp = this.content;
        this.content = '';
        return this.tmp+ ' ';
    }
}


function submittext (text, wpm) {
}



