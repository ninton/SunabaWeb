import assert = require("assert");
import fs = require("fs");
import Compiler from "../../src/sunaba/Compiler";

suite('sunaba.Compiler', () => {
    let compiler:Compiler;

    setup(() => {
        compiler = new Compiler();
    });

    teardown(() => {
    });

    test('unifySpace', () => {
        const code     = "\t----\n\t----　----　";
        const expected = "        ----\n        ----  ----  ";
        const actual   = compiler.unifySpace(code);
        assert.equal(actual, expected);
    });
    
    test('unifyNewLine', () => {
        const code     = "xxxx\nxxxx\rxxxx\r\nxxxx";
        const expected = "xxxx\nxxxx\nxxxx\nxxxx"
        const actual   = compiler.unifyNewLine(code);
        assert.equal(actual, expected);
    });
    
    test('replaceChar', () => {
        const code     = fs.readFileSync("test/fixture/02_code.sunaba").toString();
        const expected = fs.readFileSync("test/fixture/02_expected.sunaba").toString();
        const actual   = compiler.replaceChar(code);
        assert.equal(actual, expected);
    });

    test('unifyOperator', () => {
        const code     = "a >= b\na <= b\na != b\na -> b\na >= b\na <= b\na != b\na -> b\n";
        const expected = "a ≥ b\na ≤ b\na ≠ b\na → b\na ≥ b\na ≤ b\na ≠ b\na → b\n";
        const actual   = compiler.unifyOperator(code);
        assert.equal(actual, expected);
    });
    
    test('removeSingleLineComment', () => {
        const code     = fs.readFileSync("test/fixture/01_code.sunaba").toString();
        const expected = fs.readFileSync("test/fixture/01_expected.sunaba").toString();
        const actual   = compiler.removeSingleLineComment(code);
        assert.equal(actual, expected);
    });

    test('removeMultiLineComment', () => {
        const code     = fs.readFileSync("test/fixture/03_code.sunaba").toString();
        const expected = fs.readFileSync("test/fixture/03_expected.sunaba").toString();
        const actual   = compiler.removeMultiLineComment(code);
        assert.equal(actual, expected);
    });
});
