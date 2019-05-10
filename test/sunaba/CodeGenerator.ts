import assert = require("assert");
import fs     = require("fs");
import CodeGenerator from "../../src/sunaba/CodeGenerator";
import Sunaba   from "../../src/sunaba/Sunaba";

suite('sunaba.CodeGenerator', () => {
    let codeGenerator:CodeGenerator;

    setup(() => {
        codeGenerator = new CodeGenerator();
    });

    teardown(() => {
    });

    test('generateProgram', () => {
        const data = fs.readFileSync("test/fixture/04_node.json").toString();
        const rootNode = JSON.parse(data);
        const result = codeGenerator.generateProgram(rootNode);

        console.log(result);
        console.log(JSON.stringify(codeGenerator.getCommands(), undefined, 2));
    });
});