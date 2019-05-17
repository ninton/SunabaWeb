import Machine             from './sunaba/Machine';
import Compiler            from './sunaba/Compiler';
import MouseDeviceImpl     from './MouseDeviceImpl';
import KeyboardDeviceImpl  from './KeyboardDeviceImpl';
import CharacterDeviceImpl from './CharacterDeviceImpl';
import GraphicDeviceImpl   from './GraphicDeviceImpl';

window.addEventListener('load', () => {
  const frontCanvas:HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('screen2');
  const backCanvas:HTMLCanvasElement   = <HTMLCanvasElement>document.getElementById('screen');

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

  window.setInterval(() => {
    machine.runSingleFrame(INTERVAL_MILLSECONDS - 2, MAX_STEP_COUNT_PER_FRAME);
  }, INTERVAL_MILLSECONDS);
});
