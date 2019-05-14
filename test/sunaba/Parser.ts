import assert = require("assert");
import fs = require("fs");
import Sunaba from "../../src/sunaba/Sunaba";
import { TokenType } from "../../src/sunaba/TokenType";
import Parser from "../../src/sunaba/Parser";

suite('sunaba.Parser', () => {
    setup(() => {
    });

    teardown(() => {
    });

    test('parseProgram　#1', () => {
        const tokens = [
            {type: TokenType.TOKEN_NAME         , line: 1, string: "memory"                },
            {type: TokenType.TOKEN_INDEX_BEGIN  , line: 1, string: "["                     },
            {type: TokenType.TOKEN_NUMBER       , line: 1, string: "65050" , number: 65050 },
            {type: TokenType.TOKEN_INDEX_END    , line: 1, string: "]"                     },
            {type: TokenType.TOKEN_SUBSTITUTION , line: 1, string: "→"                    },
            {type: TokenType.TOKEN_NUMBER       , line: 1, string: "999999", number: 999999},
            {type: TokenType.TOKEN_STATEMENT_END, line: 1, string: "行末"                  },
            {type: TokenType.TOKEN_END          , line: 1                                  }
        ];
        const parser = new Parser(tokens, Sunaba.locales.japanese);
        const root = parser.parseProgram();
        //console.log(JSON.stringify(root, null, 4));

        const expected = JSON.parse(fs.readFileSync('test/fixture/04_node.json').toString());
        assert.deepEqual(expected, root);
    });

    test('parseProgram #2', () => {
        const tokens = JSON.parse(fs.readFileSync('test/fixture/06_token.json').toString());
        const parser = new Parser(tokens, Sunaba.locales.japanese);
        const root = parser.parseProgram();
        //console.log(JSON.stringify(root, null, 4));

        const expected = JSON.parse(fs.readFileSync('test/fixture/06_node.json').toString());
        assert.deepEqual(expected, root);
    });
});
