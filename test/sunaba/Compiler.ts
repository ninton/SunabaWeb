import assert = require("assert");
import fs     = require("fs");
import Compiler from "../../src/sunaba/Compiler";
import Sunaba   from "../../src/sunaba/Sunaba";
import TokenType from "../../src/sunaba/TokenType";
import Token from "../../src/sunaba/Token";

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
                {type: TokenType.TOKEN_LINE_BEGIN  , line: 1, string: "",       number: 0     },
                {type: TokenType.TOKEN_NAME        , line: 1, string: "メモリ"                },
                {type: TokenType.TOKEN_INDEX_BEGIN , line: 1, string: "["                     },
                {type: TokenType.TOKEN_NUMBER      , line: 1, string: "60000" , number: 60000 },
                {type: TokenType.TOKEN_INDEX_END   , line: 1, string: "]"                     },
                {type: TokenType.TOKEN_SUBSTITUTION, line: 1, string: "→"                    },
                {type: TokenType.TOKEN_NUMBER      , line: 1, string: "999999", number: 999999}
            ],
            errorMessage:  ""
        };

        const actual = compiler.tokenize(code, Sunaba.locales.japanese);
        assert.deepEqual(expected, actual);
    });

    test('tokenize #2', () => {
        const code = "メモリ[60000] → (1 + 3) * 2\n";
        const expected = {
            tokens: [
                {type: TokenType.TOKEN_LINE_BEGIN   , line: 1, string: ""      , number: 0     },
                {type: TokenType.TOKEN_NAME         , line: 1, string: "メモリ"                },
                {type: TokenType.TOKEN_INDEX_BEGIN  , line: 1, string: "["                     },
                {type: TokenType.TOKEN_NUMBER       , line: 1, string: "60000" , number: 60000 },
                {type: TokenType.TOKEN_INDEX_END    , line: 1, string: "]"                     },
                {type: TokenType.TOKEN_SUBSTITUTION , line: 1, string: "→"                    },
                {type: TokenType.TOKEN_LEFT_BRACKET , line: 1, string: "("                     },
                {type: TokenType.TOKEN_NUMBER       , line: 1, string: "1"     , number: 1     },
                {type: TokenType.TOKEN_OPERATOR     , line: 1, string: "+"     , operator: "+" },
                {type: TokenType.TOKEN_NUMBER       , line: 1, string: "3"     , number: 3     },
                {type: TokenType.TOKEN_RIGHT_BRACKET, line: 1, string: ")"                     },
                {type: TokenType.TOKEN_OPERATOR     , line: 1, string: "*"     , operator: "*" },
                {type: TokenType.TOKEN_NUMBER       , line: 1, string: "2"     , number: 2     }
            ],
            errorMessage: ""
        };

        const actual = compiler.tokenize(code, Sunaba.locales.japanese);
        assert.deepEqual(expected, actual);
    });

    test('tokenize #3', () => {
        const code = "メモリ[60000] = 1 なら\n";
        const expected = {
            tokens: [
                {type: TokenType.TOKEN_LINE_BEGIN   , line: 1, string: ""      , number: 0     },
                {type: TokenType.TOKEN_NAME         , line: 1, string: "メモリ"                },
                {type: TokenType.TOKEN_INDEX_BEGIN  , line: 1, string: "["                     },
                {type: TokenType.TOKEN_NUMBER       , line: 1, string: "60000" , number: 60000 },
                {type: TokenType.TOKEN_INDEX_END    , line: 1, string: "]"                     },
                {type: TokenType.TOKEN_OPERATOR     , line: 1, string: "="     , operator: "=" },
                {type: TokenType.TOKEN_NUMBER       , line: 1, string: "1"     , number: 1     },
                {type: TokenType.TOKEN_IF_POST      , line: 1, string: "なら"                  }
            ],
            errorMessage: ""
        };

        const actual = compiler.tokenize(code, Sunaba.locales.japanese);
        assert.deepEqual(expected, actual);
    });

    test('tokenize #4', () => {
        const code = "メモリ[60000] = 100 な限り\n";
        const expected = {
            tokens: [
                {type: TokenType.TOKEN_LINE_BEGIN   , line: 1, string: ""      , number: 0     },
                {type: TokenType.TOKEN_NAME         , line: 1, string: "メモリ"                },
                {type: TokenType.TOKEN_INDEX_BEGIN  , line: 1, string: "["                     },
                {type: TokenType.TOKEN_NUMBER       , line: 1, string: "60000" , number: 60000 },
                {type: TokenType.TOKEN_INDEX_END    , line: 1, string: "]"                     },
                {type: TokenType.TOKEN_OPERATOR     , line: 1, string: "="     , operator: "=" },
                {type: TokenType.TOKEN_NUMBER       , line: 1, string: "100"   , number: 100   },
                {type: TokenType.TOKEN_WHILE_POST   , line: 1, string: "な限り"                }
            ],
            errorMessage: ""
        };

        const actual = compiler.tokenize(code, Sunaba.locales.japanese);
        assert.deepEqual(expected, actual);
    });

    test('tokenize #5', () => {
        const code = "点(縦,横) とは\n";
        const expected = {
            tokens: [
                {type: TokenType.TOKEN_LINE_BEGIN   , line: 1, string: ""      , number: 0     },
                {type: TokenType.TOKEN_NAME         , line: 1, string: "点"                    },
                {type: TokenType.TOKEN_LEFT_BRACKET , line: 1, string: "("                     },
                {type: TokenType.TOKEN_NAME         , line: 1, string: "縦"                    },
                {type: TokenType.TOKEN_COMMA        , line: 1, string: ","                     },
                {type: TokenType.TOKEN_NAME         , line: 1, string: "横"                    },
                {type: TokenType.TOKEN_RIGHT_BRACKET, line: 1, string: ")"                     },
                {type: TokenType.TOKEN_DEF_POST     , line: 1, string: "とは"                  }
            ],
            errorMessage: ""
        };

        const actual = compiler.tokenize(code, Sunaba.locales.japanese);
        assert.deepEqual(expected, actual);
    });

    test('structurize #1', () => {
        // code = "メモリ[60000] → 999999\n";

        const tokens = [
            {type: TokenType.TOKEN_LINE_BEGIN  , line: 1, string: "",       number: 0     },
            {type: TokenType.TOKEN_NAME        , line: 1, string: "メモリ"                },
            {type: TokenType.TOKEN_INDEX_BEGIN , line: 1, string: "["                     },
            {type: TokenType.TOKEN_NUMBER      , line: 1, string: "60000" , number: 60000 },
            {type: TokenType.TOKEN_INDEX_END   , line: 1, string: "]"                     },
            {type: TokenType.TOKEN_SUBSTITUTION, line: 1, string: "→"                    },
            {type: TokenType.TOKEN_NUMBER      , line: 1, string: "999999", number: 999999}
        ];
        const expected = {
            tokens: [
                {type: TokenType.TOKEN_NAME         , line: 1, string: "メモリ"                },
                {type: TokenType.TOKEN_INDEX_BEGIN  , line: 1, string: "["                     },
                {type: TokenType.TOKEN_NUMBER       , line: 1, string: "60000" , number: 60000 },
                {type: TokenType.TOKEN_INDEX_END    , line: 1, string: "]"                     },
                {type: TokenType.TOKEN_SUBSTITUTION , line: 1, string: "→"                    },
                {type: TokenType.TOKEN_NUMBER       , line: 1, string: "999999", number: 999999},
                {type: TokenType.TOKEN_STATEMENT_END, line: 1, string: "行末"                  },
                {type: TokenType.TOKEN_END          , line: 1, string: ''                      }
            ],
            errorMessage: ""
        };

        const actual = compiler.structurize(<Array<Token>>tokens);
        assert.deepEqual(expected, actual);
    });

    test('compile #1', () => {
        const expected = {
            errorMessage: '',
            commands:     JSON.parse(fs.readFileSync('test/fixture/04_vmcode.json').toString())
        };

        const code = fs.readFileSync('test/fixture/04_code.sunaba').toString();
        const actual = compiler.compile(code);

        assert.deepEqual(expected, actual);
    });

    test('compile #2', () => {
        const expected = {
            errorMessage: '',
            commands:     JSON.parse(fs.readFileSync('test/fixture/04_vmcode.json').toString())
        };

        const code = "memory[65050] → 999999\n";
        const actual = compiler.compile(code);

        assert.deepEqual(expected, actual);
    });

    test('compile #3', () => {
        const expected = {
            errorMessage: '',
            commands:     JSON.parse(fs.readFileSync('test/fixture/04_vmcode.json').toString())
        };

        const code = "memory[65049 + 1] → 999900 + 99\n";
        const actual = compiler.compile(code);

        assert.deepEqual(expected, actual);
    });

    test('compile #4', () => {
        const expected = {
            errorMessage: '',
            commands:     JSON.parse(fs.readFileSync('test/fixture/04_vmcode.json').toString())
        };

        const code = "memory[65047 + 1 + 2] → 990000 + 9900 + 99\n";
        const actual = compiler.compile(code);

        assert.deepEqual(expected, actual);
    });

    test('compile #5', () => {
        const expected = {
            errorMessage: '',
            commands:     JSON.parse(fs.readFileSync('test/fixture/09_vmcode.json').toString())
        };

        const code = "memory[1] → memory[1] + 1\n";
        const actual = compiler.compile(code);

        assert.deepEqual(expected, actual);
    });

    test('compile error #1', () => {
        const code = "memory[65047 + 1 + 2] → 990000 + 9900 + \n";
        const actual = compiler.compile(code);

        assert.ok(actual.errorMessage.indexOf("E181") >= 0);
    });

    test('compile error #2', () => {
        const code = "memory[65047 + 1 + 2] → 990000 / 0\n";
        const actual = compiler.compile(code);

        assert.ok(actual.errorMessage.indexOf("E171") >= 0);
    });

    test('compile expression #2', () => {
        const expected = {
            errorMessage: '',
            commands:     JSON.parse(fs.readFileSync('test/fixture/06_vmcode.json').toString())
        };

        const code = "点()\n\n点() とは\n\tメモリ[60000] → 999999\n";
        const actual = compiler.compile(code);
        //console.log(JSON.stringify(compiler.rootNode, undefined, 2));

        assert.deepEqual(expected, actual);
    });

    test('compile expression #3', () => {
        const expected = {
            errorMessage: '',
            commands:     JSON.parse(fs.readFileSync('test/fixture/07_vmcode.json').toString())
        };

        const code = fs.readFileSync('test/fixture/07_sunaba.txt').toString()
        const actual = compiler.compile(code);
        //console.log(JSON.stringify(actual, undefined, 2));

        assert.deepEqual(expected, actual);
    });

    test('compile output #1', () => {
        const expected = {
            structurized_tokens: JSON.parse(fs.readFileSync('test/fixture/08_structurized_tokens.json').toString()),
            vmcode:              JSON.parse(fs.readFileSync('test/fixture/08_vmcode.json').toString())
        };

        const code = fs.readFileSync('test/fixture/08_sunaba.txt').toString()
        const actual = compiler.compile(code);
        //console.log(JSON.stringify(compiler.structurizedResults, undefined, 2));
        //console.log(JSON.stringify(compiler.rootNode, undefined, 2));
        //console.log(JSON.stringify(actual, undefined, 2));

        assert.deepEqual(expected.structurized_tokens, compiler.structurizedResults.tokens);
        assert.deepEqual(expected.vmcode, actual.commands);
    });
});
