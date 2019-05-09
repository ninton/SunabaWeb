import assert = require("assert");
import fs = require("fs");
import Sunaba from "../../src/sunaba/Sunaba";

suite('sunaba.Compiler', () => {
    setup(() => {
    });

    teardown(() => {
    });

    test('readNumber', () => {
        assert.equal( 1234, Sunaba.readNumber(" 1234 " , 1, 4));
        assert.equal(-1234, Sunaba.readNumber(" -1234 ", 1, 5));
        assert.equal(    0, Sunaba.readNumber(" 0 "    , 1, 1));
        assert.equal(    0, Sunaba.readNumber(" -0 "   , 1, 2));
    });
});
