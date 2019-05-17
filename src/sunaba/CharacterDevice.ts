export interface CharacterDevice {
  outMessage(s:string): void;
  outDebug(n:number): void;
}

export class NullCharacterDevice implements CharacterDevice {
  /* eslint no-console: 0 */
  outMessage(s: string): void {
    console.log(s);
  }

  outDebug(n: number): void {
    console.log(n);
  }
}
