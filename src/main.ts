import { sprintf } from "sprintf-js";
import Machine from "./sunaba/Machine";
import Compiler from "./sunaba/Compiler";

const canvas:any = document.getElementById("screen");
const SCREEN_WIDTH:number  = 100;
const SCREEN_HEIGHT:number = 100;

const ctx:any = canvas.getContext('2d');

const vramClear:Function = () => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, SCREEN_WIDTH * 4, SCREEN_HEIGHT * 4);
};

const vramListener:Function = (addr:number, value:number) => {
    const x = addr % SCREEN_WIDTH;
    const y = Math.floor(addr / SCREEN_WIDTH);

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

const machine:Machine = new Machine();
machine.setMessageHandler((mesg:string) => {
    document.getElementById("message").value += `${mesg}\n`;
});

document.getElementById("runButton").onclick = function () {
    const code = document.getElementById("code").value;
    console.log(code);

    const compiler = new Compiler();
    const results = compiler.compile(code);
    if (0 < results.errorMessage.length) {
        document.getElementById("message").value += `${results.errorMessage}\n`;
        return;
    }

    vramClear();
    machine.setVramListener(vramListener);
    machine.loadProgram(results.commands);
};

document.getElementById("stopButton").onclick = function () {
    machine.stop();
};

document.getElementById("clearButton").onclick = function () {
    document.getElementById("message").value = "";
};

const uiStatus:any = {
    'mouse_x'    : 10,
    'mouse_y'    : 20,
    'mouse_left' : 0,
    'mouse_right': 0,
    'key_up'     : 0,
    'key_down'   : 0,
    'key_left'   : 0,
    'key_right'  : 0,
    'key_space'  : 0,
    'key_enter'  : 0
};

machine.setUICallback((name:string) => {
    return uiStatus[name];
});

const INTERVAL_MILLISEC = 1;
const STEP_COUNT = 10;

window.setInterval(() => {
    for (let i = 0; i < STEP_COUNT; i += 1) {
        machine.step();
    }
}, INTERVAL_MILLISEC);

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
        "imm": "func_!main",
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
        "imm": "!end",
        "comment": ""
        },
        {
        "name": "pop",
        "imm": 1,
        "comment": "#!mainの戻り値を破棄。最終命令。なくてもいいが。"
        }
    ];
}
