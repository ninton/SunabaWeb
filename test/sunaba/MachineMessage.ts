/* eslint-env mocha */
/* eslint no-unused-vars: 0 */
import Machine from '../../src/sunaba/Machine';
import { CharacterDevice, NullCharacterDevice } from '../../src/sunaba/CharacterDevice';

import assert = require('assert');

suite('sunaba.MachineMessage', () => {
  let machine:Machine;

  setup(() => {
    machine = new Machine();
  });

  teardown(() => {
  });

  test('start program', () => {
    const expected = [
      'プログラムを起動',
      'プログラムが最後まで実行された。',
    ];

    const program = [
      {
        name: 'i',
        imm: 0,
      },
      {
        name: 'i',
        imm: 999999,
      },
      {
        name: 'st',
        imm: 60010,
      },
    ];

    const mesgArr:Array<string> = [];

    const characterDevice = new NullCharacterDevice();
    characterDevice.outMessage = ((mesg:string) => {
      mesgArr.push(mesg);
    });

    machine.setCharacterDevice(characterDevice);
    machine.loadProgram(program);
    assert.deepEqual(['プログラムを起動'], mesgArr);

    machine.step();
    machine.step();
    machine.step();

    assert.deepEqual(expected, mesgArr);
  });

  test('0 div', () => {
    const program = [
      {
        name: 'i',
        imm: 6,
      },
      {
        name: 'i',
        imm: 0,
      },
      {
        name: 'div',
      },
    ];

    const mesgArr:Array<string> = [];
    const characterDevice = new NullCharacterDevice();
    characterDevice.outMessage = ((mesg:string) => {
      mesgArr.push(mesg);
    });

    machine.setCharacterDevice(characterDevice);

    machine.loadProgram(program);
    machine.step();
    machine.step();
    machine.step();

    assert.ok(mesgArr[1].indexOf('E910') >= 0);
  });
});
