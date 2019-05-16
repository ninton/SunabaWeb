import { sprintf } from 'sprintf-js';
import Machine from './sunaba/Machine';
import Compiler from './sunaba/Compiler';

const SCREEN_WIDTH:number  = 100;
const SCREEN_HEIGHT:number = 100;

const canvas2:any = document.getElementById('screen2');
const ctx2:any = canvas2.getContext('2d');

const canvas:any = document.getElementById('screen');
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

const outputMessage = (s:string) => {
  (<HTMLInputElement>document.getElementById('message'))!.value += s;
};

const onOutputListener = (name:string, value:number) => {
  if  (name === 'sync') {
    waitSync = true;
    return;
  }

  if (name === 'autosync_disable') {
    isAutoSync = !value;
    return;
  }

  if (name === 'debug') {
    outputMessage(String.fromCharCode(value));
  }
};

const vramListener = (addr:number, value:number) => {
  const x = addr % SCREEN_WIDTH;
  const y = Math.floor(addr / SCREEN_WIDTH);

  let r = 0;
  let g = 0;
  let b = 0;

  if (value < 0) {
    r = 0;
    g = 0;
    b = 0;
  } else if (value > 999999) {
    r = 0xFF;
    g = 0xFF;
    b = 0xFF;
  } else {
    r = Math.floor(value / 10000) % 100;
    g = Math.floor(value / 100) % 100;
    b = (value % 100);
    r *= (255 / 99);
    g *= (255 / 99);
    b *= (255 / 99);
  }
  const color = `#${sprintf('%02x%02x%02x', r, g, b)}`;

  ctx.fillStyle = color;
  ctx.fillRect(x * 4, y * 4, 4, 4);
};

const machine:Machine = new Machine();
machine.setMessageHandler((mesg:string) => {
  outputMessage(`${mesg}\n`);
});

document.getElementById('runButton')!.onclick = () => {
  const code = (<HTMLInputElement>document.getElementById('code'))!.value;

  const compiler = new Compiler();
  const results = compiler.compile(code);
  if (results.errorMessage.length > 0) {
    outputMessage(`${results.errorMessage}\n`);
    return;
  }

  vramClear();
  machine.setVramListener(vramListener);
  machine.setOnOutputListener(onOutputListener);
  machine.loadProgram(results.commands);
};

document.getElementById('stopButton')!.onclick = () => {
  machine.stop();
};

document.getElementById('clearButton')!.onclick = () => {
  (<HTMLInputElement>document.getElementById('message'))!.value = '';
};

const uiStatus:{[key:string]: number;} = {
  mouse_x:    10,
  mouse_y:    20,
  mouse_left:  0,
  mouse_right: 0,
  key_up:      0,
  key_down:    0,
  key_left:    0,
  key_right:   0,
  key_space:   0,
  key_enter:   0,
};

machine.setOnInputListener((name:string) => uiStatus[name]);


canvas2.addEventListener('mousemove', (event:MouseEvent) => {
  uiStatus.mouse_x = Math.floor(event.offsetX / 4);
  uiStatus.mouse_y = Math.floor(event.offsetY / 4);
});

canvas2.addEventListener('mousedown', (event:MouseEvent) => {
  uiStatus.mouse_x = Math.floor(event.offsetX / 4);
  uiStatus.mouse_y = Math.floor(event.offsetY / 4);

  if (event.button === 0) {
    uiStatus.mouse_left = 1;
  } else if (event.button === 2) {
    uiStatus.mouse_right = 1;
  }
});

canvas2.addEventListener('mouseup', (event:MouseEvent) => {
  uiStatus.mouse_x = Math.floor(event.offsetX / 4);
  uiStatus.mouse_y = Math.floor(event.offsetY / 4);

  if (event.button === 0) {
    uiStatus.mouse_left = 0;
  } else if (event.button === 2) {
    uiStatus.mouse_right = 0;
  }
});

const KEYCODE_NAME_MAP:{[key:number]: string} = {
  // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode#Value_of_keyCode
  38: 'key_up',
  40: 'key_down',
  37: 'key_left',
  39: 'key_right',
  32: 'key_space',
  13: 'key_enter',
};

window.addEventListener('keydown', (event:KeyboardEvent) => {
  if (event.keyCode in KEYCODE_NAME_MAP) {
    const name = KEYCODE_NAME_MAP[event.keyCode];
    uiStatus[name] = 1;
  }
});

window.addEventListener('keyup', (event:KeyboardEvent) => {
  if (event.keyCode in KEYCODE_NAME_MAP) {
    const name = KEYCODE_NAME_MAP[event.keyCode];
    uiStatus[name] = 0;
  }
});


// TODO: UIスライダーで調整できるようにしたい
const INTERVAL_MILLSECONDS = 33;  // 16:速すぎ、33:まだ速い
const MAX_STEP_COUNT_PER_FRAME = 1000;

const time_miliiSeconds = ():number => {
  const date:Date = new Date();
  const t_ms:number = date.getTime();
  return t_ms;
};

window.setInterval(() => {
  const t0_ms:number = time_miliiSeconds();

  for (let i = 0; i < MAX_STEP_COUNT_PER_FRAME; i += 1) {
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
