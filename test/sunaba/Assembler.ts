import assert = require("assert");
import fs = require("fs");
import Assembler from "../../src/sunaba/Assembler";

suite('sunaba.Assembler', () => {
    let assembler:Assembler;

    setup(() => {
        assembler = new Assembler();
    });

    teardown(() => {
    });

    test('Assember', () => {
        const expected = JSON.parse(fs.readFileSync('test/fixture/04_vmcode.json').toString());

        const asmCmds = JSON.parse(fs.readFileSync('test/fixture/04_assemble.json').toString());
        const vmCmds = assembler.assemble(asmCmds);

        assert.deepEqual(expected, vmCmds);
    });
});
