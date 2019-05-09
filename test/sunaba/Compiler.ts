import assert = require("assert");
import fs     = require("fs");
import Compiler from "../../src/sunaba/Compiler";
import Sunaba   from "../../src/sunaba/Sunaba";

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

    test('tokenize #1', () => {
        const code = "メモリ[60000] → 999999\n";
        const expected = {
            tokens: [
                {type: "LINE_BEGIN", line: 1,                   number: 0     },
                {type: "NAME"      , line: 1, string: "メモリ"                },
                {type: "["         , line: 1, string: "["                     },
                {type: "NUMBER"    , line: 1, string: "60000" , number: 60000 },
                {type: "]"         , line: 1, string: "]"                     },
                {type: "→"        , line: 1, string: "→"                    },
                {type: "NUMBER"    , line: 1, string: "999999", number: 999999},
                {type: "END"       , line: 2, string: ""                      }
            ],
            errorMessage: null
        };

        const actual = compiler.tokenize(code, Sunaba.locales.japanese);
        assert.deepEqual(expected, actual);
    });

    test('tokenize #2', () => {
        const code = "メモリ[60000] → (1 + 3) * 2\n";
        const expected = {
            tokens: [
                {type: "LINE_BEGIN", line: 1,                   number: 0     },
                {type: "NAME"      , line: 1, string: "メモリ"                },
                {type: "["         , line: 1, string: "["                     },
                {type: "NUMBER"    , line: 1, string: "60000" , number: 60000 },
                {type: "]"         , line: 1, string: "]"                     },
                {type: "→"        , line: 1, string: "→"                    },
                {type: "("         , line: 1, string: "("                     },
                {type: "NUMBER"    , line: 1, string: "1"     , number: 1     },
                {type: "OPERATOR"  , line: 1, string: "+"     , operator: "+" },
                {type: "NUMBER"    , line: 1, string: "3"     , number: 3     },
                {type: ")"         , line: 1, string: ")"                     },
                {type: "OPERATOR"  , line: 1, string: "*"     , operator: "*" },
                {type: "NUMBER"    , line: 1, string: "2"     , number: 2     },
                {type: "END"       , line: 2, string: ""                      }
            ],
            errorMessage: null
        };

        const actual = compiler.tokenize(code, Sunaba.locales.japanese);
        assert.deepEqual(expected, actual);
    });

    test('tokenize #3', () => {
        const code = "メモリ[60000] = 1 なら\n";
        const expected = {
            tokens: [
                {type: "LINE_BEGIN", line: 1,                   number: 0     },
                {type: "NAME"      , line: 1, string: "メモリ"                },
                {type: "["         , line: 1, string: "["                     },
                {type: "NUMBER"    , line: 1, string: "60000" , number: 60000 },
                {type: "]"         , line: 1, string: "]"                     },
                {type: "OPERATOR"  , line: 1, string: "="     , operator: "=" },
                {type: "NUMBER"    , line: 1, string: "1"     , number: 1     },
                {type: "IF_POST"   , line: 1, string: "なら"                  },
                {type: "END"       , line: 2, string: ""                      }
            ],
            errorMessage: null
        };

        const actual = compiler.tokenize(code, Sunaba.locales.japanese);
        assert.deepEqual(expected, actual);
    });

    test('tokenize #4', () => {
        const code = "メモリ[60000] = 100 な限り\n";
        const expected = {
            tokens: [
                {type: "LINE_BEGIN", line: 1,                   number: 0     },
                {type: "NAME"      , line: 1, string: "メモリ"                },
                {type: "["         , line: 1, string: "["                     },
                {type: "NUMBER"    , line: 1, string: "60000" , number: 60000 },
                {type: "]"         , line: 1, string: "]"                     },
                {type: "OPERATOR"  , line: 1, string: "="     , operator: "=" },
                {type: "NUMBER"    , line: 1, string: "100"   , number: 100   },
                {type: "WHILE_POST", line: 1, string: "な限り"                },
                {type: "END"       , line: 2, string: ""                      }
            ],
            errorMessage: null
        };

        const actual = compiler.tokenize(code, Sunaba.locales.japanese);
        assert.deepEqual(expected, actual);
    });

    test('tokenize #5', () => {
        const code = "点(縦,横) とは\n";
        const expected = {
            tokens: [
                {type: "LINE_BEGIN", line: 1,                   number: 0     },
                {type: "NAME"      , line: 1, string: "点"                    },
                {type: "("         , line: 1, string: "("                     },
                {type: "NAME"      , line: 1, string: "縦"                    },
                {type: ","         , line: 1, string: ","                     },
                {type: "NAME"      , line: 1, string: "横"                    },
                {type: ")"         , line: 1, string: ")"                     },
                {type: "DEF_POST"  , line: 1, string: "とは"                  },
                {type: "END"       , line: 2, string: ""                      }
            ],
            errorMessage: null
        };

        const actual = compiler.tokenize(code, Sunaba.locales.japanese);
        assert.deepEqual(expected, actual);
    });
});
