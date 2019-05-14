import { sprintf } from "sprintf-js";
import Machine from "./sunaba/Machine";
import Compiler from "./sunaba/Compiler";

const SCREEN_WIDTH:number  = 100;
const SCREEN_HEIGHT:number = 100;

const canvas2:any = document.getElementById("screen2");
const ctx2:any = canvas2.getContext('2d');

const canvas:any = document.getElementById("screen");
const ctx:any = canvas.getContext('2d');

let waitSync:boolean = false;

const sync = () => {
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx2.putImageData(image, 0, 0);
    waitSync = false;
};

const vramClear:Function = () => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, SCREEN_WIDTH * 4, SCREEN_HEIGHT * 4);
    sync();
};

let isAutoSync:boolean = true;

const onOutputListener:Function = (name:string, value:number) => {
    if  (name === 'sync') {
        waitSync = true;
        return;
    }

    if (name === 'autosync_disable') {
        isAutoSync = value ? false : true;
        console.log(`${name} ${value} ${isAutoSync}`);
        return;
    }

    if (name === 'debug') {
        outputMessage(String.fromCharCode(value));
        return;
    }
};

const outputMessage = (s:string) => {
    document.getElementById("message").value += s;
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
    outputMessage(`${mesg}\n`);
});

document.getElementById("runButton").onclick = function () {
    const code = document.getElementById("code").value;
    console.log(code);

    const compiler = new Compiler();
    const results = compiler.compile(code);
    if (0 < results.errorMessage.length) {
        outputMessage(`${results.errorMessage}\n`);
        return;
    }

    vramClear();
    machine.setVramListener(vramListener);
    machine.setOnOutputListener(onOutputListener);
    machine.loadProgram(results.commands);
};

document.getElementById("stopButton").onclick = function () {
    machine.stop();
};

document.getElementById("clearButton").onclick = function () {
    document.getElementById("message").value = "";
};

let uiStatus:any = {
    mouse_x    : 10,
    mouse_y    : 20,
    mouse_left : 0,
    mouse_right: 0,
    key_up     : 0,
    key_down   : 0,
    key_left   : 0,
    key_right  : 0,
    key_space  : 0,
    key_enter  : 0
};

machine.setOnInputListener((name:string) => {
    return uiStatus[name];
});


canvas.addEventListener('mousemove', (event) => {
    uiStatus.mouse_x = event.offsetX / 4;
    uiStatus.mouse_y = event.offsetY / 4;
});

canvas.addEventListener('mousedown', (event) => {
    uiStatus.mouse_x = event.offsetX / 4;
    uiStatus.mouse_y = event.offsetY / 4;

    if (event.button === 0) {
        uiStatus.mouse_left = 1;
    } else if (event.button === 2) {
        uiStatus.mouse_right = 1;
    }
});

canvas.addEventListener('mouseup', (event) => {
    if (event.button === 0) {
        uiStatus.mouse_left = 0;
    } else if (event.button === 2) {
        uiStatus.mouse_right = 0;
    }
});

const KEYCODE_NAME_MAP:any = {
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode#Value_of_keyCode
    38: 'key_up',
    40: 'key_down',
    37: 'key_left',
    39: 'key_right',
    32: 'key_space',
    13: 'key_enter'
};

window.addEventListener('keydown', (event:any) => {
    if (event.keyCode in KEYCODE_NAME_MAP) {
        const name = KEYCODE_NAME_MAP[event.keyCode];
        uiStatus[name] = 1;
    }
});

window.addEventListener('keyup', (event:any) => {
    if (event.keyCode in KEYCODE_NAME_MAP) {
        const name = KEYCODE_NAME_MAP[event.keyCode];
        uiStatus[name] = 0;
    }
});


const INTERVAL_MILLSECONDS = 16;

const time_miliiSeconds = ():number => {
    const date = new Date();
    const t_ms:number = date.getTime();
    return t_ms;
}

window.setInterval(() => {
    const t0_ms:number = time_miliiSeconds();

    while (true) {
        machine.step();
        if (waitSync) {
            break;
        }

        const t1_ms:number = time_miliiSeconds();
        const dt_ms:number = t1_ms - t0_ms;
        if (INTERVAL_MILLSECONDS - 2 <= dt_ms) {
            break;
        }
    }

    if (isAutoSync || waitSync) {
        sync();
    }

}, INTERVAL_MILLSECONDS);

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
