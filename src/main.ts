import Machine             from './sunaba/Machine';
import Compiler            from './sunaba/Compiler';
import MouseDeviceImpl     from './MouseDeviceImpl';
import KeyboardDeviceImpl  from './KeyboardDeviceImpl';
import CharacterDeviceImpl from './CharacterDeviceImpl';
import GraphicDeviceImpl   from './GraphicDeviceImpl';

window.addEventListener('load', () => {
  let waitSync:boolean = false;
  let isAutoSync:boolean = true;

  const frontCanvas:HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('screen2');
  const backCanvas:HTMLCanvasElement   = <HTMLCanvasElement>document.getElementById('screen');

  const onOutputListener = (name:string, value:number) => {
    if  (name === 'sync') {
      waitSync = true;
      return;
    }

    if (name === 'autosync_disable') {
      isAutoSync = !value;
    }
  };

  const machine:Machine = new Machine();

  const mouseDevice = new MouseDeviceImpl(frontCanvas);
  machine.setMouseDevice(mouseDevice);

  const keyboardDevice = new KeyboardDeviceImpl(window);
  machine.setKeyboardDevice(keyboardDevice);

  const characterDevice = new CharacterDeviceImpl(<HTMLTextAreaElement>document.getElementById('message'));
  machine.setCharacterDevice(characterDevice);

  const graphicDevice = new GraphicDeviceImpl(frontCanvas, backCanvas);
  machine.setGraphicDevice(graphicDevice);

  document.getElementById('runButton')!.addEventListener('click', () => {
    const code = (<HTMLInputElement>document.getElementById('code'))!.value;

    const compiler = new Compiler();
    const results = compiler.compile(code);
    if (results.errorMessage.length > 0) {
      characterDevice.outMessage(`${results.errorMessage}\n`);
      return;
    }

    graphicDevice.clear();
    machine.setOnOutputListener(onOutputListener);
    machine.loadProgram(results.commands);
  });

  document.getElementById('stopButton')!.addEventListener('click', () => {
    machine.stop();
  });

  document.getElementById('clearButton')!.addEventListener('click', () => {
    (<HTMLInputElement>document.getElementById('message'))!.value = '';
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
      graphicDevice.vsync();
      waitSync = false;
    }
  }, INTERVAL_MILLSECONDS);
});
