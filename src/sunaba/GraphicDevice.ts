/* eslint no-unused-vars: 0 */
export interface GraphicDevice {
  clear(): void;
  write(addr:number, value:number): void;
  vsync(): void;
}

export class NullGraphicDevice implements GraphicDevice {
  clear(): void {
  }

  write(addr: number, value: number): void {
  }

  vsync(): void {
  }
}
