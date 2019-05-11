import HLib from "./HLib";
import CodeGenerator from "./CodeGenerator";
import FunctionInfo from "./FunctionInfo";

class Variable {
    private mDefined    : boolean;
    private mInitialized: boolean;
    private mOffset     : number;

    constructor() {
        this.mDefined     = false;
        this.mInitialized = false;
        this.mOffset      = 0;
    }

    public set(address:number) {
        this.mOffset = address;

    }
    public define() {
        this.mDefined = true;
    }
    public initialize() {
        this.mInitialized = true;
    }

    public isDefined(): boolean {
        return this.mDefined;
    }
    public isInitialized(): boolean {
        return this.mInitialized;
    }

    public offset(): number {
        return this.mOffset;
    }
}

class Block {
    public mParent    :Block|null;
    public mBaseOffset:number;
    public mFrameSize :number;
    private mVariables:any;
    private stream:any;

    constructor(baseOffset:number) {
        this.mParent     = null;
        this.mBaseOffset = baseOffset;
        this.mFrameSize  = 0;
        this.stream = (s:string) => {
            console.log(s);
        }
    }

    public beginError(node:any) {
        const token = node.token;
        HLib.assert(token);

        let s = '';
        if (token.line != 0) {
            s = `(${token.line})`;
        } else {
            s = ' ';
        }
        this.stream(s);
    }

    public addVariable(name:string, isArgument:boolean = false): boolean {
        if (this.mVariables[name] !== undefined) {
            return false;
        }

        const retVar:Variable = new Variable();
        retVar.set(this.mBaseOffset + this.mFrameSize);
        this.mFrameSize += 1;
        if (isArgument){ //引数なら定義済みかつ初期化済み
            retVar.define();
            retVar.initialize();
        }
        this.mVariables[name] = retVar;
        return true;
    }

    public collectVariables(firstStatement:any): void {
        let statement = firstStatement;
        while (statement){
            //代入文なら、変数名を取得して登録。
            if (statement.type == '→'){
                const left = statement.child;
                HLib.assert(left);

                if (left.type === 'VARIABLE'){ //変数への代入文のみ扱う。配列要素や定数は無視。
                    HLib.assert(left.token);
                    const vName = left.token.string;

                    //ここより上にこの変数があるか調べる。
                    const v = this.findVariable(vName);
                    if (!v){
                        //ない。新しい変数を生成
                        if (!this.addVariable(vName)){
                            //ありえん
                            HLib.assert(false);
                        }
                    }
                }
            }
            statement = statement.brother;
        }
    }

    public findVariable(name:string): Variable|null {
        if (this.mVariables[name] !== undefined) {
            //自分にあった。
            return this.mVariables[name];
        } else if (this.mParent) {
            //親がいる
            return this.mParent.findVariable(name);
        } else {
            return null;
        }
    }
}

export default class FunctionGenerator {
    codeGen:CodeGenerator;
    cmds:Array<any>;

    mMessageStream:any; //借り物
	mRootBlock    :Block|null;
	mCurrentBlock :Block|null;
	mLabelId      :number;
	mName         :string;
	mInfo         :FunctionInfo|null;
	mFunctionMap  :any;
	mOutputExist  :boolean;

    constructor(codeGen:CodeGenerator) {
        this.codeGen = codeGen;
        this.cmds = [];

        this.mMessageStream = (s:string) => {
            console.log(s);
        };
        this.mRootBlock    = null;
        this.mCurrentBlock = null;
        this.mLabelId      = 0;
        this.mName         = '';
        this.mInfo         = null;
        this.mFunctionMap  = {};
        this.mOutputExist  = false;
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