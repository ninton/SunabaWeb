import CodeGenerator from "./CodeGenerator";

export default class FunctionGenerator {
    codeGen:CodeGenerator;
    cmds:Array<any>;

    constructor(codeGen:CodeGenerator) {
        this.codeGen = codeGen;
        this.cmds = [];
    }

    public addCommand(name:string, imm:any = 0, comment:string = "") {
        const cmd = {
            name:    name,
            imm:     imm,
            comment: comment
        };
        this.cmds.push(cmd);
    }

    public mergeCommands(cmds:Array<any>) {
        cmds.forEach((item:any) => {
            this.cmds.push(item);
        });
    }

    public getCommands() {
        return this.cmds;
    }

    public process(node:any, funcName:string): boolean {
        return true;
    }
}