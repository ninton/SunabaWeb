/* eslint no-unused-vars: 0 */
import { KeyboardDevice } from './sunaba/KeyboardDevice';

export default class KeyboardDeviceImpl implements KeyboardDevice {
  arrowLeftKeyDowned:  boolean = false;
  arrowUpKeyDowned:    boolean = false;;
  arrowRightKeyDowned: boolean = false;;
  arrowDownKeyDowned:  boolean = false;;
  spaceKeyDowned:      boolean = false;;
  enterKeyDowned:      boolean = false;;

  public isArrowLeftDowned(): boolean {
    return this.arrowLeftKeyDowned;
  }

  public isArrowUpKeyDowned(): boolean {
    return this.arrowUpKeyDowned;
  }

  public isArrowDownDowned(): boolean {
    return this.arrowDownKeyDowned;
  }

  public isArrowRightKeyDowned(): boolean {
    return this.arrowRightKeyDowned;
  }

  public isSpaceKeyDowned(): boolean {
    return this.spaceKeyDowned;
  }

  public isEnterKeyDowned(): boolean {
    return this.enterKeyDowned;
  }

  constructor(window:Window) {
    window.addEventListener('keydown', (event:KeyboardEvent) => {
      this.setKeyDowned(event.keyCode, true);
    });

    window.addEventListener('keyup', (event:KeyboardEvent) => {
      this.setKeyDowned(event.keyCode, false);
    });
  }

  setKeyDowned(keyCode:Number, downed:boolean): void {
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode#Value_of_keyCode

    switch (keyCode) {
      case 13:
        this.enterKeyDowned = downed;
        break;
      case 32:
        this.spaceKeyDowned = downed;
        break;
      case 37:
        this.arrowLeftKeyDowned = downed;
        break;
      case 38:
        this.arrowUpKeyDowned = downed;
        break;
      case 39:
        this.arrowRightKeyDowned = downed;
        break;
      case 40:
        this.arrowDownKeyDowned = downed;
        break;
      default:
        break;
    }

    // console.log(`${this.enterKeyDowned} ${this.spaceKeyDowned} ${this.arrowLeftKeyDowned} ${this.arrowUpKeyDowned} ${this.arrowRightKeyDowned} ${this.arrowDownKeyDowned}`);
  }
}
