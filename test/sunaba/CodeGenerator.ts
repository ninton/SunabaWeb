import assert = require("assert");
import fs     = require("fs");
import CodeGenerator from "../../src/sunaba/CodeGenerator";
import Sunaba   from "../../src/sunaba/Sunaba";

suite('sunaba.CodeGenerator', () => {
    let codeGenerator:CodeGenerator;

    setup(() => {
        codeGenerator = new CodeGenerator((s:string) => {
            console.log(s);
        });
    });

    teardown(() => {
    });

    test('generateProgram', () => {
        const rootNode = JSON.parse(fs.readFileSync("test/fixture/04_node.json").toString());
        const expected = JSON.parse(fs.readFileSync("test/fixture/04_assemble.json").toString());

        const result = codeGenerator.generateProgram(rootNode);
        const commands = codeGenerator.getCommands();

        // console.log(JSON.stringify(commands, undefined, 2));

        assert.ok(result);
        assert.deepEqual(expected, commands);
    });
});