/* eslint no-unused-vars: 0 */
import { sprintf } from 'sprintf-js';
import { GraphicDevice } from './sunaba/GraphicDevice';

const SCREEN_WIDTH:number  = 100;
const SCREEN_HEIGHT:number = 100;
const SCALE_X:number = 4;
const SCALE_Y:number = 4;


export default class GraphicDeviceImpl implements GraphicDevice {
  frontCanvas: HTMLCanvasElement;
  frontContext:CanvasRenderingContext2D;
  backCanvas:  HTMLCanvasElement;
  backContext: CanvasRenderingContext2D;

  clear(): void {
    this.backContext.fillStyle = '#000000';
    this.backContext.fillRect(0, 0, this.backCanvas.width, this.backCanvas.height);
    this.vsync();
  }

  write(addr:number, value:number): void {
    const x = addr % SCREEN_WIDTH;
    const y = Math.floor(addr / SCREEN_WIDTH);
    this.setPixel(x, y, value);
  }

  vsync(): void {
    const image = this.backContext.getImageData(0, 0, this.backCanvas.width, this.backCanvas.height);
    this.frontContext.putImageData(image, 0, 0);
  }

  constructor(frontCanvas:HTMLCanvasElement, backCanvas:HTMLCanvasElement) {
    this.frontCanvas = frontCanvas;
    this.backCanvas  = backCanvas;

    const fctx:any = frontCanvas.getContext('2d');
    if (fctx === null) {
      throw new Error('frontContext is null');
    }
    this.frontContext = fctx;

    const bctx:any = backCanvas.getContext('2d');
    if (bctx === null) {
      throw new Error('backContext is null');
    }
    this.backContext = bctx;
  }

  setPixel(x: number, y: number, sunabaColor: number): void {
    this.backContext.fillStyle = this.convertColor(sunabaColor);
    this.backContext.fillRect(x * SCALE_X, y * SCALE_Y, SCALE_X, SCALE_Y);
  }

  convertColor(sunabaColor:number): string {
    if (sunabaColor < 0) {
      return '#000000';
    }

    if (sunabaColor > 999999) {
      return '#FFFFFF';
    }

    let r = Math.floor(sunabaColor / 10000) % 100;
    let g = Math.floor(sunabaColor / 100) % 100;
    let b = (sunabaColor % 100);
    r *= (255 / 99);
    g *= (255 / 99);
    b *= (255 / 99);
    const color = `#${sprintf('%02x%02x%02x', r, g, b)}`;

    return color;
  }
}
