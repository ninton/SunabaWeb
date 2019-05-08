import { sprintf } from "sprintf-js";
import Machine from "./sunaba/Machine";

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

        machine.setVramDrawer(vramDrawer);
        machine.loadProgram(program);
    }
}

window.setInterval(() => {
    for (let i = 0; i < 100; i += 1) {
        machine.step();
    }
}, 1);
