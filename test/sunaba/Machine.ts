import assert = require("assert");
import Machine from "../../src/sunaba/Machine";

suite('sunaba.Machine', () => {
    let machine:Machine;

    setup(() => {
        machine = new Machine();
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
                imm: 100
            },
            {
                name: 'ld',
                imm: 60000
            }
        ];

        machine.setMemory(60100, 111111);
        machine.loadProgram(program);
        machine.step();
        machine.step();

        const actual:Array<number> = machine.getStack();

        assert.equal(1, actual.length);
        assert.equal(111111, actual[0]);
    });

    test('st', () => {
        const program = [
            {
                name: 'i',
                imm: 0
            },
            {
                name: 'i',
                imm: 999999
            },
            {
                name: 'st',
                imm: 10000
            }
        ];

console.log("#340"); 
        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();

        assert.equal(0, machine.getStack().length);
        assert.equal(999999, machine.loadMemory(10000));
    });

    test('fld', () => {
        const program = [
            {
                name: 'fld',
                imm: 2
            }
        ];

        machine.setMemory(102, 9);
        machine.loadProgram(program);
        machine.setFramePointer(100);
        machine.step();

        const actual:Array<number> = machine.getStack();

        const expected = [
            9
        ];
        assert.deepEqual(expected, actual);
    });

    test('fst', () => {
        const program = [
            {
                name: 'i',
                imm: 9
            },
            {
                name: 'fst',
                imm: 2
            }
        ];

        assert.notEqual(9, machine.loadMemory(102));

        machine.loadProgram(program);
        machine.setFramePointer(100);
        machine.step();
        machine.step();

        assert.equal(0, machine.getStack().length);
        assert.equal(9, machine.loadMemory(102));
    });

    test('j', () => {
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
            },
            {
                name: 'j',
                imm: 1
            }
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();
        assert.equal(3, machine.getProgramCounter());

        machine.step();
        assert.equal(1, machine.getProgramCounter());
    });

    test('bz 0', () => {
        const program = [
            {
                name: 'i',
                imm: 0
            },
            {
                name: 'bz',
                imm: 100
            }
        ];

        machine.loadProgram(program);
        machine.step();
        assert.equal(1, machine.getProgramCounter());

        machine.step();
        assert.equal(100, machine.getProgramCounter());
    });

    test('bz !0', () => {
        const program = [
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'bz',
                imm: 100
            }
        ];

        machine.loadProgram(program);
        machine.step();
        assert.equal(1, machine.getProgramCounter());

        machine.step();
        assert.equal(2, machine.getProgramCounter());
    });

    test('pop', () => {
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
                name: 'i',
                imm: 3
            },
            {
                name: 'pop',
                imm: 1
            },
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();

        assert.equal(machine.STACK_BASE + 3, machine.getStackPointer());

        machine.step();
        assert.equal(machine.STACK_BASE + 2, machine.getStackPointer());
    });

    test('call', () => {
        const program = [
            {
                name: 'i',
                imm: 1
            },
            {
                name: 'call',
                imm: 123
            },
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();

        const stack = machine.getStack();
        assert.equal(1, stack[0]);
        assert.equal(0, stack[1]);
        assert.equal(1, stack[2]);

        assert.equal(machine.STACK_BASE + 3, machine.getFramePointer());
        assert.equal(123, machine.getProgramCounter());
    });

    test('ret', () => {
        const program = [
            {
                name: 'i',
                imm: 11
            },
            {
                name: 'i',
                imm: 22
            },
            {
                name: 'i',
                imm: 33
            },
            {
                name: 'i',
                imm: 44
            },
            {
                name: 'ret',
                imm: 2
            },
        ];

        machine.loadProgram(program);
        machine.step();
        machine.step();
        machine.step();
        machine.step();
        machine.step();

        const stack = machine.getStack();
        assert.equal(0, stack.length);

        assert.equal(22, machine.getProgramCounter());
        assert.equal(11, machine.getFramePointer());
    });
});
