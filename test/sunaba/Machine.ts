import assert = require("assert");
import sm = require("../../src/sunaba/Machine");

suite('sunaba.Machine', () => {
    let machine:sm.sunaba.Machine;

    setup(() => {
        machine = new sm.sunaba.Machine();
    });

    teardown(() => {
    });

    test('i', () => {
        const program = [
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'i',
                imm: 2
            }
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();

        const actual:Array<number> = machine.getStack();

        assert.equal(2, actual.length);
        assert.equal(1, actual[0]);
        assert.equal(2, actual[1]);
    });

    test('add', () => {
        const program = [
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'i',
                imm: 2
            },
            {
                name: 'add'
            }
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();

        const actual:Array<number> = machine.getStack();

        assert.equal(1, actual.length);
        assert.equal(3, actual[0]);
    });

    test('sub', () => {
        const program = [
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'i',
                imm: 2
            },
            {
                name: 'sub'
            }
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();

        const actual:Array<number> = machine.getStack();

        assert.equal(1, actual.length);
        assert.equal(-1, actual[0]);
    });

    test('mul', () => {
        const program = [
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'i',
                imm: 2
            },
            {
                name: 'mul'
            }
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();

        const actual:Array<number> = machine.getStack();

        assert.equal(1, actual.length);
        assert.equal(2, actual[0]);
    });
    
    test('div', () => {
        const program = [
            {
                name: 'i',
                imm: 6
            },
            {
                name: 'i',
                imm: 2
            },
            {
                name: 'div'
            }
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();

        const actual:Array<number> = machine.getStack();

        assert.equal(1, actual.length);
        assert.equal(3, actual[0]);
    });

    test('lt', () => {
        const program = [
            {
                name: 'i',
                imm: 0
            },
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'lt'
            }
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();

        const actual:Array<number> = machine.getStack();

        assert.equal(1, actual.length);
        assert.equal(1, actual[0]);
    });

    test('le #1', () => {
        const program = [
            {
                name: 'i',
                imm: 0
            },
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'le'
            }
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();

        const actual:Array<number> = machine.getStack();

        assert.equal(1, actual.length);
        assert.equal(1, actual[0]);
    });

    test('le #2', () => {
        const program = [
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'le'
            }
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();

        const actual:Array<number> = machine.getStack();

        assert.equal(1, actual.length);
        assert.equal(1, actual[0]);
    });

    test('eq', () => {
        const program = [
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'eq'
            },
            {
                name: 'i',
                imm: 2
            },
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'eq'
            }
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();
        machine.step();
        machine.step();
        machine.step();

        const actual:Array<number> = machine.getStack();

        assert.equal(2, actual.length);
        assert.equal(1, actual[0]);
        assert.equal(0, actual[1]);
    });

    test('ne', () => {
        const program = [
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'ne'
            },
            {
                name: 'i',
                imm: 2
            },
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'ne'
            }
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();
        machine.step();
        machine.step();
        machine.step();

        const actual:Array<number> = machine.getStack();

        assert.equal(2, actual.length);
        assert.equal(0, actual[0]);
        assert.equal(1, actual[1]);
    });

    test('ld', () => {
        const program = [
            {
                name: 'i',
                imm: 11
            },
            {
                name: 'ld',
                imm: 22
            }
        ];

        machine.setMemory(33, 123);
        machine.loadProgram(program);
        machine.step();
        machine.step();

        const actual:Array<number> = machine.getStack();

        assert.equal(1, actual.length);
        assert.equal(123, actual[0]);
    });

    test('st', () => {
        const program = [
            {
                name: 'i',
                imm: 123
            },
            {
                name: 'i',
                imm: 100
            },
            {
                name: 'st',
                imm: 2
            }
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();

        assert.equal(0, machine.getStack().length);
        assert.equal(123, machine.loadMemory(102));
    });
});
