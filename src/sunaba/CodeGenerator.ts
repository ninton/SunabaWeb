import HLib from './HLib';
import FunctionInfo from './FunctionInfo';

export default class CodeGenerator {
    mFunctionMap:any;
    cmds:Array<any>;

    constructor() {
        this.mFunctionMap = {}; 
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

    public getCommands() {
        return this.cmds;
    }

    public generateProgram(node:any): any {
        HLib.assert(node.type === 'PROGRAM');
        this.addCommand("pop",   -1, "#$mainの戻り値領域");
        this.addCommand("call", "func_!main"); //main()呼び出し 160413: add等のアセンブラ命令と同名の関数があった時にラベルを命令と間違えて誤作動する問題の緊急回避
    
        this.addCommand("j", "!end", "#プログラム終了点へジャンプ"); //プログラム終了点へジャンプ
        //$mainの情報を足しておく
        const mainFuncInfo = this.mFunctionMap["!main"] = new FunctionInfo();

        //関数情報収集。関数コールを探しだして、見つけ次第、引数、出力、名前についての情報を収集してmapに格納
        let child = node.mChild;
        while (child) {
            if (child.mType == "FUNCTION") {
                if (!this.collectFunctionDefinitionInformation(child)) { //main以外
                    return false;
                }
            }
            child = child.mBrother;
        }
        //関数コールを探しだして、見つけ次第コード生成
        child = node.mChild;
        while (child) {
            if (child.mType === "FUNCTION") {
                if (!this.generateFunctionDefinition(child)) { //main以外
                    return false;
                }
            } else if (this.isOutputValueSubstitution(child)) { //なければ出力があるか調べる
                mainFuncInfo.setHasOutputValue(); //戻り値があるのでフラグを立てる。
            }
            child = child.mBrother;
        }
        //あとはmain
        if (!this.generateFunctionDefinition(node)) {
            return false;
        }
        //最後にプログラム終了ラベル
        this.addCommand("label", "!end:");
        this.addCommand("pop", 1, "#!mainの戻り値を破棄。最終命令。なくてもいいが。");
        return true;   
    }

    public collectFunctionDefinitionInformation(node:any): boolean {
        return true;
    }

    public generateFunctionDefinition(node:any): boolean {
        return true;
    }

    public isOutputValueSubstitution(node:any): boolean {
        return false;
    }
}