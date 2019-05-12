import assert = require("assert");
import Machine from "../../src/sunaba/Machine";

suite('sunaba.Machine', () => {
    let machine:Machine;

    setup(() => {
        machine = new Machine();
    });

    teardown(() => {
    });

    test('start program', () => {
        const expected = [
            "プログラムを起動",
            "プログラムが最後まで実行された。"
        ];

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
                imm: 60010
            }
        ];

        const mesgArr:Array<string> = [];
        machine.setMessageHandler((mesg:string) => {
            mesgArr.push(mesg);
        });

        machine.loadProgram(program);
        assert.deepEqual(["プログラムを起動"], mesgArr);

        machine.step();
        machine.step();
        machine.step();

        assert.deepEqual(expected, mesgArr);
    });
});
