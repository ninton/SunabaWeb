import assert = require("assert");
import Machine from "../../src/sunaba/Machine";

suite('sunaba.Machine', () => {
    let machine:Machine;

    setup(() => {
        machine = new Machine();
    });

    teardown(() => {
    });

    test('draw(0,0, 999999)', () => {
        const program = [
            {
                name: 'i',
                imm: 999999
            },
            {
                name: 'i',
                imm: 60000
            },
            {
                name: 'st',
                imm: 0
            }
        ];

        let cb_addr:number  = -1;
        let cb_value:number = -1;
        machine.setVramDrawer((addr:number, value:number) => {
            cb_addr  = addr;
            cb_value = value;
        });
        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();

        assert.equal(999999, machine.loadMemory(machine.VRAM_BASE + 0));
        assert.equal(0,      cb_addr);
        assert.equal(999999, cb_value);
    });

    test('draw(100,0, 888888)', () => {
        const program = [
            {
                name: 'i',
                imm: 888888
            },
            {
                name: 'i',
                imm: 60100
            },
            {
                name: 'st',
                imm: 0
            }
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();

        assert.equal(888888, machine.loadMemory(machine.VRAM_BASE + 100));
    });
});
