/* eslint no-unused-vars: 0 */
import { MouseDevice } from './sunaba/MouseDevice';

export default class MouseDeviceImpl implements MouseDevice {
  posX:number = 0;
  posY:number = 0;
  leftDowned:boolean = false;
  rightDowned:boolean = false;

  public getPosX(): number {
    return this.posX;
  }

  public getPosY(): number {
    return this.posY;
  }

  public isLeftButtonDowned(): boolean {
    return this.leftDowned;
  }

  public isRightButtonDowned(): boolean {
    return this.rightDowned;
  }

  /* eslint no-bitwise: 0 */
  constructor(el:HTMLElement) {
    const LEFT_MASK = 1;
    const RIGHT_MASK = 2;

    el.addEventListener('mousemove', (event:MouseEvent) => {
      this.posX = Math.floor(event.offsetX / 4);
      this.posY = Math.floor(event.offsetY / 4);
    });

    el.addEventListener('mousedown', (event:MouseEvent) => {
      this.posX = Math.floor(event.offsetX / 4);
      this.posY = Math.floor(event.offsetY / 4);

      this.leftDowned  = (event.buttons & LEFT_MASK)  !== 0;
      this.rightDowned = (event.buttons & RIGHT_MASK) !== 0;
    });

    el.addEventListener('mouseup', (event:MouseEvent) => {
      this.posX = Math.floor(event.offsetX / 4);
      this.posY = Math.floor(event.offsetY / 4);

      this.leftDowned  = (event.buttons & LEFT_MASK)  !== 0;
      this.rightDowned = (event.buttons & RIGHT_MASK) !== 0;
    });
  }
}
