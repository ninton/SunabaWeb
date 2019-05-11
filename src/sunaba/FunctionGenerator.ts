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
        this.mVariables = {};

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
        if (!(name in this.mVariables)) {
            return false;
        }

        const retVar:Variable = new Variable();
        retVar.set(this.mBaseOffset + this.mFrameSize);
        this.mFrameSize += 1;
        if (isArgument){ // 引数なら定義済みかつ初期化済み
            retVar.define();
            retVar.initialize();
        }
        this.mVariables[name] = retVar;
        return true;
    }

    public collectVariables(firstStatement:any): void {
        let statement = firstStatement;
        while (statement){
            // 代入文なら、変数名を取得して登録。
            if (statement.type == '→'){
                const left = statement.child;
                HLib.assert(left);

                if (left.type === 'VARIABLE'){ // 変数への代入文のみ扱う。配列要素や定数は無視。
                    HLib.assert(left.token);
                    const vName = left.token.string;

                    // ここより上にこの変数があるか調べる。
                    const v = this.findVariable(vName);
                    if (!v){
                        // ない。新しい変数を生成
                        if (!this.addVariable(vName)){
                            // ありえん
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
            // 自分にあった。
            return this.mVariables[name];
        } else if (this.mParent) {
            // 親がいる
            return this.mParent.findVariable(name);
        } else {
            return null;
        }
    }
}

export default class FunctionGenerator {
    codeGen:CodeGenerator;
    cmds:Array<any>;

    mMessageStream:Function; // 借り物
	mRootBlock    :Block;
	mCurrentBlock :Block;
	mLabelId      :number;
	mName         :string;
	mInfo         :FunctionInfo;
	mFunctionMap  :any;
	mOutputExist  :boolean;

    constructor(codeGen:CodeGenerator) {
        this.codeGen = codeGen;
        this.cmds = [];

        this.mMessageStream = (s:string) => {
            console.log(s);
        };
        this.mRootBlock    = new Block(0);  // dummy
        this.mCurrentBlock = new Block(0);  // dummy
        this.mLabelId      = 0;
        this.mName         = "";
        this.mInfo         = new FunctionInfo();    // dummy
        this.mFunctionMap  = codeGen.mFunctionMap;
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
        this.mName = funcName;
        this.mInfo = this.mFunctionMap[this.mName];

        // 後でエラー出力に使うのでとっておく。
        const headNode = node;

        // FP相対オフセットを計算
        const argCount:number = this.mInfo.argCount();

        // ルートブロック生成(TODO:このnew本来不要。コンストラクタでスタックに持つようにできるはず)
        this.mCurrentBlock = this.mRootBlock = new Block(-argCount - 3);  // 戻り値、引数*N、FP、CPと詰めたところが今のFP。戻り値の位置は-argcount-3

        // 戻り値変数を変数マップに登録
        this.mCurrentBlock.addVariable("!ret");

        // 引数処理
        // みつかった順にアドレスを割り振りながらマップに登録。
        // 呼ぶ時は前からプッシュし、このあとFP,PCをプッシュしたところがSPになる。
        let child = node.child;
        while (child){ // このループを抜けた段階で最初のchildは最初のstatementになっている
            if (child.type !== 'VARIABLE'){
                break;
            }

            HLib.assert(child.token);
            const variableName = child.token.string;

            if (!this.mCurrentBlock.addVariable(variableName, true)) {
                this.beginError(node);
                this.mMessageStream("部分プログラム\"");
                this.mMessageStream(this.mName);
                this.mMessageStream("\"の入力\"");
                this.mMessageStream(variableName);
                this.mMessageStream("\"はもうすでに現れた。二個同じ名前があるのはダメ。\n");
                return false;
            }
            child = child.brother;
        }

        // FP、CPを変数マップに登録(これで処理が簡単になる)
        this.mCurrentBlock.addVariable("!fp");
        this.mCurrentBlock.addVariable("!cp");

        // ルートブロックのローカル変数サイズを調べる
        this.mRootBlock.collectVariables(child);

        // 関数開始コメント
        this.addCommand('', '', `#部分プログラム"${this.mName}"の開始\n`);
        // 関数開始ラベル
        // 160413: add等のアセンブラ命令と同名の関数があった時にラベルを命令と間違えて誤作動する問題の緊急回避
        this.addCommand('label', `func_${this.mName}:\n`);

        // ローカル変数を確保
        // 戻り値、FP、CP、引数はここで問題にするローカル変数ではない。呼出側でプッシュしているからだ。
        const netFrameSize:number = this.mCurrentBlock.mFrameSize - 3 - argCount;
        if (netFrameSize > 0) {
            // -1は戻り値を入れてしまった分
            this.addCommand("pop", -netFrameSize, "#ローカル変数確保");
        }

        // 中身を処理
        let lastStatement = 0;
        while (child){
            if (!this.generateStatement(child)){
                return false;
            }
            lastStatement = child;
            child = child.brother;
        }

        // 関数終了点ラベル。上のループの中でreturnがあればここに飛んでくる。
        // 	this.addCommand("label", `${this.mName}_end:`);

        // ret生成(ローカル変数)
        this.addCommand("ret", netFrameSize, `#部分プログラム"${this.mName}の終了`);

        // 出力の整合性チェック。
        // ifの中などで出力してるのに、ブロック外に出力がないケースを検出
        if (this.mInfo.hasOutputValue() != this.mOutputExist){
            HLib.assert(this.mOutputExist); // outputExistがfalseで、hasOutputValue()がtrueはありえない
            if (headNode.token) {
                // 普通の関数ノード
                this.beginError(headNode);
                this.mMessageStream(`部分プログラム"${this.mName}"は出力したりしなかったりする。条件実行や繰り返しの中だけで出力していないか？\b`);
            } else {
                // プログラムノード
                HLib.assert(headNode.child);
                this.beginError(headNode.child);
                this.mMessageStream("このプログラムは出力したりしなかったりする。条件実行や繰り返しの中だけで出力していないか？\n");
            }
            return false;
        }

        return true;
    }

    public generateStatement(node:any): boolean {
        // ブロック生成命令は別扱い
        if ((node.type === 'WHILE') || (node.type === 'IF')) {
            //新ブロック生成
            const newBlock = new Block(this.mCurrentBlock.mBaseOffset + this.mCurrentBlock.mFrameSize);
            newBlock.mParent = this.mCurrentBlock; //親差し込み
            newBlock.collectVariables(node.child); //フレーム生成
            this.mCurrentBlock = newBlock;

            //ローカル変数を確保
            if (this.mCurrentBlock.mFrameSize > 0) {
                this.addCommand("pop", -(this.mCurrentBlock.mFrameSize), "#ブロックローカル変数確保");
            }

            if (node.type === 'WHILE') {
                if (!this.generateWhile(node)){
                    return false;
                }
            } else if (node.type === 'IF') {
                if (!this.generateIf(node)){
                    return false;
                }
            }

            //ローカル変数ポップ
            if (this.mCurrentBlock.mFrameSize > 0) {
                this.addCommand("pop", this.mCurrentBlock.mFrameSize, "#ブロックローカル変数破棄");
            }
            this.mCurrentBlock = this.mCurrentBlock.mParent; //スタック戻し

        } else if (node.type === 'SET') {
            if (!this.generateSubstitution(node)){
                return false;
            }
        } else if (node.type === 'CALL') {
            //関数だけ呼んで結果を代入しない文
            if (!this.generateFunctionStatement(node)) {
                return false;
            }
        } else if (node.type === 'FUNC') {
            //関数定義はもう処理済みなので無視。
            ; //スルー
        } else {
            console.log("#1 " + node.type);
            HLib.assert(false, `FcuntionGenerator.ts:318 node.type:${node.type}`);
        }

        return true;
    }

    /*
    ブロック開始処理に伴うローカル変数確保を行い、

    1の間ループ.0ならループ後にジャンプと置き換える。

    whileBegin:
    Expression;
    push 0
    eq
    b whileEnd
    Statement ...
    push 1
    b whileBegin // 最初へ
    whileEnd:
    */
    public generateWhile(node:any): boolean {
        return true;
    }

    /*
    1なら直下を実行.0ならif文末尾にジャンプと置き換える
    Expression
    push 0
    eq
    b ifEnd
    Statement...
    ifEnd:
    */
    public generateIf(node:any): boolean {
        return true;
    }
    
    public generateFunctionStatement(node:any): boolean {
        return true;
    }
    
    public generateFunction(node:any): boolean {
        return true;
    }

    /*
    LeftValue
    Expression
    st
    */
    public generateSubstitution(node:any): boolean {
        return true;
    }

    public generateExpression(node:any): boolean {
        return true;
    }

    public generateTerm(): boolean {
        return true;
    }

    public pushDynamicOffset(node:any): boolean {
        return true;
    }

    public beginError(node:any): void {

    }
}