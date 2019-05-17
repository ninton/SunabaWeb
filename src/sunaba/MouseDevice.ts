export interface MouseDevice {
  getPosX(): number;
  getPosY(): number;
  isLeftButtonDowned(): boolean;
  isRightButtonDowned(): boolean;
}

export class NullMouseDevice implements MouseDevice {
  getPosX(): number {
    return 0;
  }

  getPosY(): number {
    return 0;
  }

  isLeftButtonDowned(): boolean {
    return false;
  }

  isRightButtonDowned(): boolean {
    return false;
  }
}
