import assert = require("assert");
import fs = require("fs");
import Sunaba from "../../src/sunaba/Sunaba";
import Assembler from "../../src/sunaba/Assembler";

suite('sunaba.Assembler', () => {
    let assembler:Assembler;

    setup(() => {
        assembler = new Assembler();
    });

    teardown(() => {
    });

    test('Assember', () => {
        const expected = {
            result: true,
            commands: JSON.parse(fs.readFileSync('test/fixture/04_vmcode.json').toString())
        };

        const cmds = JSON.parse(fs.readFileSync('test/fixture/04_assemble.json').toString());
        const results = assembler.assemble(cmds);

        assert.deepEqual(expected, results);
    });
});
