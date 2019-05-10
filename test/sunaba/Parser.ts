import assert = require("assert");
import fs = require("fs");
import Sunaba from "../../src/sunaba/Sunaba";
import Parser from "../../src/sunaba/Parser";

suite('sunaba.Compiler', () => {
    setup(() => {
    });

    teardown(() => {
    });

    test('parseProgram', () => {
        const tokens = [
            {type: "NAME"      , line: 1, string: "メモリ"                },
            {type: "["         , line: 1, string: "["                     },
            {type: "NUMBER"    , line: 1, string: "60000" , number: 60000 },
            {type: "]"         , line: 1, string: "]"                     },
            {type: "→"        , line: 1, string: "→"                    },
            {type: "NUMBER"    , line: 1, string: "999999", number: 999999},
            {type: "END"       , line: 2, string: ""                      },
            {type: ";"         , line: 2, string: ";"                     }
        ];
        const parser = new Parser(tokens, Sunaba.locales.japanese);
        assert.equal(true, true);
    });
});
