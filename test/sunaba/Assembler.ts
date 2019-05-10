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
        assembler.assemble();
    });
});
