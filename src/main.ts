/* eslint no-unused-vars: 0 */
import { readFile } from 'fs';
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

(() => {
  const elDrop:HTMLElement|null         = document.getElementById('code');
  const elCode:HTMLTextAreaElement|null = <HTMLTextAreaElement>document.getElementById('code');

  function showDropping() {
    elDrop!.classList.add('dropover');
  }

  function hideDropping() {
    elDrop!.classList.remove('dropover');
  }

  function findTextPlain(files:FileList): File|null {
    for (let i = 0; i < files.length; i += 1) {
      const file:File = files[i];
      if (file.type === 'text/plain') {
        return file;
      }
    }

    return null;
  }

  function showText(file:File) {
    const reader = new FileReader();

    // TODO: event:Eventにして、test実行すると、
    // testerror TS2339: Property 'result' does not exist on type 'EventTarget'.となってしまう
    reader.onload = (event:any) => {
			elCode!.value = event.target!.result;
    };

    reader.readAsText(file);
  }

  elDrop!.addEventListener('dragover', (event:DragEvent) => {
    event.preventDefault();
    /* eslint no-param-reassign: 0 */
    event.dataTransfer!.dropEffect = 'copy';
    showDropping();
  });

  elDrop!.addEventListener('dragleave', () => {
    hideDropping();
  });

  elDrop!.addEventListener('drop', (event:DragEvent) => {
    event.preventDefault();
    hideDropping();

    const file:File|null = findTextPlain(event.dataTransfer!.files);
    if (file !== null) {
      showText(file);
    }
  });
})();
