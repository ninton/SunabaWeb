import HLib from './HLib';
import FunctionInfo from './FunctionInfo';
import FunctionGenerator from './FunctionGenerator';

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

    public mergeCommands(cmds:Array<any>) {
        cmds.forEach((item:any) => {
            this.cmds.push(item);
        });
    }

    public getCommands() {
        return this.cmds;
    }

    public generateProgram(node:any): any {
        HLib.assert(node.type === 'PROGRAM', `${__filename}:34`);
        this.addCommand("pop",   -1, "#$mainの戻り値領域");
        this.addCommand("call", "func_!main"); // main()呼び出し 160413: add等のアセンブラ命令と同名の関数があった時にラベルを命令と間違えて誤作動する問題の緊急回避
    
        this.addCommand("j", "!end", "#プログラム終了点へジャンプ"); // プログラム終了点へジャンプ
        // $mainの情報を足しておく
        const mainFuncInfo = this.mFunctionMap["!main"] = new FunctionInfo();

        // 関数情報収集。関数コールを探しだして、見つけ次第、引数、出力、名前についての情報を収集してmapに格納
        let child = node.mChild;
        while (child) {
            if (child.mType == "FUNCTION") {
                if (!this.collectFunctionDefinitionInformation(child)) { // main以外
                    return false;
                }
            }
            child = child.mBrother;
        }

        // 関数コールを探しだして、見つけ次第コード生成
        child = node.mChild;
        while (child) {
            if (child.mType === "FUNCTION") {
                if (!this.generateFunctionDefinition(child)) { // main以外
                    return false;
                }
            } else if (this.isOutputValueSubstitution(child)) { // なければ出力があるか調べる
                mainFuncInfo.setHasOutputValue(); // 戻り値があるのでフラグを立てる。
            }
            child = child.mBrother;
        }

        // あとはmain
        if (!this.generateFunctionDefinition(node)) {
            return false;
        }

        // 最後にプログラム終了ラベル
        this.addCommand("label", "!end");
        this.addCommand("pop", 1, "#!mainの戻り値を破棄。最終命令。なくてもいいが。");
        return true;   
    }

    public collectFunctionDefinitionInformation(node:any): boolean {
        let argCount = 0; // 引数の数
        // まず、関数マップに項目を足す
        let funcName:string;
        let child = node.child;

        let funcInfo:FunctionInfo;
        HLib.assert(node.token, `${__filename}:84`);

        funcName = node.token.string;

        // 関数重複チェック
        if (this.mFunctionMap[funcName] !== undefined) {
            this.beginError(node);
            throw `部分プログラム${funcName}はもう作られている。`;
        }
        funcInfo = this.mFunctionMap[funcName] = new FunctionInfo();

        // 引数の処理
        // まず数を数える
        { // argが後ろに残ってるとバグ源になるので閉じ込める
            let arg = child; // childは後で必要なので、コピーを操作
            while (arg){
                if (arg.type !== "VARIABLE"){
                    break;
                }
                argCount += 1;
                arg = arg.mBrother;
            }
        }
        funcInfo.setArgCount(argCount);

        // 出力値があるか調べる
        let lastStatement = 0;
        while (child){
            if (this.isOutputValueSubstitution(child)){
                funcInfo.setHasOutputValue(); // 戻り値があるのでフラグを立てる。
            }
            lastStatement = child;
            child = child.brother;
        }
        return true;
    }

    public generateFunctionDefinition(node:any): boolean {
        // まず、関数マップに項目を足す
        let funcName:string;
        if (node.token) {
            funcName = node.token.string;
        } else {
            funcName = "!main";
        }

        // 関数重複チェック
        HLib.assert(this.mFunctionMap[funcName] !== undefined, `${__filename}:131`); //絶対ある

        const functionGenerator = new FunctionGenerator(this);
        functionGenerator.process(node, funcName);
        const cmds = functionGenerator.getCommands();
        this.mergeCommands(cmds);

        return true;
    }

    public beginError(node:any) {

    }

    public isOutputValueSubstitution(node:any): boolean {
        return node.type === 'OUT';
    }
}