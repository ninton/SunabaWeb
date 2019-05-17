/* eslint no-unused-vars: 0 */
import { CharacterDevice } from './sunaba/CharacterDevice';

export default class CharacterDeviceImpl implements CharacterDevice {
  textarea:HTMLTextAreaElement|null = null;

  outMessage(s: string): void {
    this.print(`${s}\n`);
  }

  outDebug(n: number): void {
    this.print(`debug: ${n}\n`);
  }

  constructor(textarea:HTMLTextAreaElement) {
    this.textarea = textarea;
  }

  print(s:string): void {
    this.textarea!.value += s;
  }
}
