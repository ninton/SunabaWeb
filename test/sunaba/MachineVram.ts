/* eslint-env mocha */
/* eslint no-unused-vars: 0 */
import Machine from '../../src/sunaba/Machine';
import { GraphicDevice, NullGraphicDevice } from '../../src/sunaba/GraphicDevice';

import assert = require('assert');

suite('sunaba.Machine Vram', () => {
  let machine:Machine;

  setup(() => {
    machine = new Machine();
  });

  teardown(() => {
  });

  test('draw(10,0, 999999)', () => {
    const program = [
      {
        name: 'i',
        imm:  0,
      },
      {
        name: 'i',
        imm:  999999,
      },
      {
        name: 'st',
        imm:  60010,
      },
    ];

    let cb_addr:number  = -1;
    let cb_value:number = -1;

    const graphicDevice:GraphicDevice = new NullGraphicDevice();
    graphicDevice.write = ((addr:number, value:number) => {
      cb_addr  = addr;
      cb_value = value;
    });

    machine.setGraphicDevice(graphicDevice);
    machine.loadProgram(program);
    machine.step();
    machine.step();
    machine.step();

    assert.equal(999999, machine.loadMemory(machine.VRAM_BASE + 10));
    assert.equal(10,   cb_addr);
    assert.equal(999999, cb_value);
  });

  test('draw(23,1, 888888)', () => {
    const program = [
      {
        name: 'i',
        imm:  0,
      },
      {
        name: 'i',
        imm:  888888,
      },
      {
        name: 'st',
        imm:  60123,
      },
    ];

    let cb_addr:number  = -1;
    let cb_value:number = -1;

    const graphicDevice:GraphicDevice = new NullGraphicDevice();
    graphicDevice.write = ((addr:number, value:number) => {
      cb_addr  = addr;
      cb_value = value;
    });

    machine.setGraphicDevice(graphicDevice);
    machine.loadProgram(program);
    machine.step();
    machine.step();
    machine.step();

    assert.equal(888888, machine.loadMemory(machine.VRAM_BASE + 123));
    assert.equal(123,  cb_addr);
    assert.equal(888888, cb_value);
  });
});
