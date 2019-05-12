import { sprintf } from "sprintf-js";
import Machine from "./sunaba/Machine";
import Compiler from "./sunaba/Compiler";

var canvas = document.getElementById("screen");
var ctx = {
    fillStyle: "",
    fillRect: (x:number, y:number, w:number, h:number) => {}
};

if (canvas !== null) {
    ctx = canvas.getContext('2d');
}

var vramDrawer = (addr:number, value:number) => {
    const x = addr % 100;
    const y = Math.floor(addr / 100);

    let r = 0;
    let g = 0;
    let b = 0;

    if (value < 0) {
        r = g = b = 0;
    } else if (999999 < value) {
        r = g = b = 0xFF;
    } else {
        r = Math.floor(value / 10000) % 100;
        g = Math.floor(value / 100) % 100;
        b = (value % 100);
        r *= (255 / 99);
        g *= (255 / 99);
        b *= (255 / 99);    
    }
    const color = "#" + sprintf("%02x%02x%02x", r, g, b);

    ctx.fillStyle = color;
    ctx.fillRect(x * 4, y * 4, 4, 4);
}

let machine:Machine = new Machine();

let runButton = document.getElementById("runButton");
if (runButton !== null) {
    runButton.onclick = function () {
        const code = document.getElementById("code").value;

        const compiler = new Compiler();
        const result = compiler.compile(code);

        machine.setVramDrawer(vramDrawer);

        console.log(result.commands);
        machine.loadProgram(result.commands);
    }
}

window.setInterval(() => {
    for (let i = 0; i < 100; i += 1) {
        machine.step();
    }
}, 1);

function program_1(): Array<any> {
    const program:Array<any> = [];

    for (let y = 0; y < 100; y += 1) {
        for (let x = 0; x < 100; x += 1) {
            let addr = y * 100 + x;

            program.push({
                name: 'i',
                imm: 888888
            });
            program.push({
                name: 'i',
                imm: 60000 + addr
            });
            program.push({
                name: 'st',
                imm: 0
            });
        }
    }

    return program;
}

function program_2(): Array<any> {
    return [
        {
            "name": "i",
            "imm": 0,
            "comment": "#絶対アドレスなので0\n"
        },
        {
            "name": "i",
            "imm": 999999,
            "comment": "#即値プッシュ"
        },
        {
            "name": "st",
            "imm": 60110,
            "comment": "#\"memory\"へストア"
        },
    ];
}

function program_3(): Array<any> {
    return [
        {
        "name": "pop",
        "imm": -1,
        "comment": "#$mainの戻り値領域"
        },
        {
        "name": "call",
        "imm": 4,
        "comment": ""
        },
        {
        "name": "j",
        "imm": 9,
        "comment": "#プログラム終了点へジャンプ"
        },
        {
        "name": "",
        "imm": "",
        "comment": "#部分プログラム\"!main\"の開始\n"
        },
        {
        "name": "label",
        "imm": "func_!main:\n",
        "comment": ""
        },
        {
        "name": "i",
        "imm": 0,
        "comment": "#絶対アドレスなので0\n"
        },
        {
        "name": "i",
        "imm": 999999,
        "comment": "#即値プッシュ"
        },
        {
        "name": "st",
        "imm": 60110,
        "comment": "#\"memory\"へストア"
        },
        {
        "name": "ret",
        "imm": -3,
        "comment": "#部分プログラム\"!mainの終了"
        },
        {
        "name": "label",
        "imm": "!end:",
        "comment": ""
        },
        {
        "name": "pop",
        "imm": 1,
        "comment": "#!mainの戻り値を破棄。最終命令。なくてもいいが。"
        }
    ];
}
