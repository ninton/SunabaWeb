export interface KeyboardDevice {
  isArrowLeftDowned(): boolean;
  isArrowUpKeyDowned(): boolean;
  isArrowDownDowned(): boolean;
  isArrowRightKeyDowned(): boolean;
  isSpaceKeyDowned(): boolean;
  isEnterKeyDowned(): boolean;
}

export class NullKeyboardDevice implements KeyboardDevice {
  isArrowLeftDowned(): boolean {
    return false;
  }

  isArrowUpKeyDowned(): boolean {
    return false;
  }

  isArrowDownDowned(): boolean {
    return false;
  }

  isArrowRightKeyDowned(): boolean {
    return false;
  }

  isSpaceKeyDowned(): boolean {
    return false;
  }

  isEnterKeyDowned(): boolean {
    return false;
  }
}
