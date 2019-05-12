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
        if (isArgument) { // 引数なら定義済みかつ初期化済み
            retVar.define();
            retVar.initialize();
        }
        this.mVariables[name] = retVar;
        return true;
    }

    public collectVariables(firstStatement:any): void {
        let statement = firstStatement;
        while (statement) {
            // 代入文なら、変数名を取得して登録。
            if (statement.type == '→') {
                const left = statement.child;
                HLib.assert(left);

                if (left.type === 'VARIABLE') { // 変数への代入文のみ扱う。配列要素や定数は無視。
                    HLib.assert(left.token);
                    const vName = left.token.string;

                    // ここより上にこの変数があるか調べる。
                    const v = this.findVariable(vName);
                    if (!v) {
                        // ない。新しい変数を生成
                        if (!this.addVariable(vName)) {
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

    // E200
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
        while (child) { // このループを抜けた段階で最初のchildは最初のstatementになっている
            if (child.type !== 'VARIABLE') {
                break;
            }

            HLib.assert(child.token);
            const variableName = child.token.string;

            if (!this.mCurrentBlock.addVariable(variableName, true)) {
                this.beginError(node);
                throw `E201: 部分プログラム"${this.mName}"の入力"${variableName}はもうすでに現れた。二個同じ名前があるのはダメ。`
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
        this.addCommand('label', `func_${this.mName}`);

        // ローカル変数を確保
        // 戻り値、FP、CP、引数はここで問題にするローカル変数ではない。呼出側でプッシュしているからだ。
        const netFrameSize:number = this.mCurrentBlock.mFrameSize - 3 - argCount;
        if (netFrameSize > 0) {
            // -1は戻り値を入れてしまった分
            this.addCommand("pop", -netFrameSize, "#ローカル変数確保");
        }

        // 中身を処理
        let lastStatement = 0;
        while (child) {
            if (!this.generateStatement(child)) {
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
        if (this.mInfo.hasOutputValue() != this.mOutputExist) {
            HLib.assert(this.mOutputExist); // outputExistがfalseで、hasOutputValue()がtrueはありえない
            if (headNode.token) {
                // 普通の関数ノード
                this.beginError(headNode);
                throw `E201: 部分プログラム"${this.mName}"は出力したりしなかったりする。条件実行や繰り返しの中だけで出力していないか？`;
            } else {
                // プログラムノード
                HLib.assert(headNode.child);
                this.beginError(headNode.child);
                throw `E202: このプログラムは出力したりしなかったりする。条件実行や繰り返しの中だけで出力していないか？`;
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
                if (!this.generateWhile(node)) {
                    return false;
                }
            } else if (node.type === 'IF') {
                if (!this.generateIf(node)) {
                    return false;
                }
            }

            //ローカル変数ポップ
            if (this.mCurrentBlock.mFrameSize > 0) {
                this.addCommand("pop", this.mCurrentBlock.mFrameSize, "#ブロックローカル変数破棄");
            }
            this.mCurrentBlock = this.mCurrentBlock.mParent; //スタック戻し

        } else if (node.type === 'SET') {
            if (!this.generateSubstitution(node)) {
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
        HLib.assert(node.type === 'WHILE');

        //開始ラベル
        const whileBegin = `${this.mName}_whileBegin${this.mLabelId}`;
        const whileEnd   = `${this.mName}_whileEnd${this.mLabelId}`;
        this.mLabelId += 1;

        this.addCommand('label', whileBegin);

        //Expression処理
        let child = node.child;
        HLib.assert(child);
        if (!this.generateExpression(child)) {
            //最初の子はExpression
            return false;
        }

        //いくつかコード生成
        this.addCommand('bz', whileEnd);

        //内部の文を処理
        child = child.brother;
        while (child) {
            if (!this.generateStatement(child)) {
                return false;
            }
            child = child.brother;
        }

        //ループの最初へ飛ぶジャンプを生成
        this.addCommand('j', whileBegin, '#ループ先頭へ無条件ジャンプ');

        //ループ終了ラベルを生成
        this.addCommand('label', whileEnd);

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
        HLib.assert(node.type === 'IF');

        // Expression処理
        let  child = node.child;
        HLib.assert(child);
        if (!this.generateExpression(child)) {
            // 最初の子はExpression
            return false;
        }

        // コード生成
        const label_ifEnd = `${this.mName}_ifEnd${this.mLabelId}`;
        this.mLabelId += 1;

        this.addCommand('bz', label_ifEnd);

        // 内部の文を処理
        child = child.brother;
        while (child) {
            if (!this.generateStatement(child)) {
                return false;
            }
            child = child.brother;
        }

        // ラベル生成
        this.addCommand('label', label_ifEnd);

        return true;
    }
    
    public generateFunctionStatement(node:any): boolean {
	    // まず関数呼び出し
	    if (!this.generateFunction(node, true)) {
		    return false;
        }

	    // 関数の戻り値がプッシュされているので捨てます。
        // this.addCommandg("pop", 1, "#戻り値を使わないので、破棄");

        return true;
    }
    
    // E210
    public generateFunction(node:any, isStatement:boolean): boolean {
        HLib.assert(node.type === 'FUNCTION');

        // まず、その関数が存在していて、定義済みかを調べる。
        HLib.assert(node.token);
        const funcName = node.token.string;
        if (!(funcName in this.mFunctionMap)) {
            this.beginError(node);
            throw `E210: 部分プログラム"${funcName}"なんて知らない。`;
        }

        const func = this.mFunctionMap[funcName];
        let popCount = 0; // 後で引数/戻り値分ポップ
        if (func.hasOutputValue()) {
            // 戻り値あるならプッシュ
            this.addCommand('pop', -1, `#${funcName}の戻り値領域`);

            if (isStatement) {
                // 戻り値を使わないのでポップ数+1
                popCount += 1;
            }
        } else if (!isStatement) {
            // 戻り値がないなら式の中にあっちゃだめ
            this.beginError(node);
            throw `E211: 部分プログラム\"${funcName}"は、"出力"か"out"という名前付きメモリがないので、出力は使えない。ifやwhileの中にあってもダメ。`;
        }

        // 引数の数をチェック
        let arg = node.child;
        let argCount = 0;
        while (arg) {
            argCount += 1;
            arg = arg.brother;
        }

        popCount += argCount; // 引数分追加
        if (argCount !== func.argCount()) {
            this.beginError(node);
            throw `E212: 部分プログラム"${funcName}"は、入力を${func.argCount()}個受け取るのに、ここには$$argCount}個ある。間違い。`;
        }

       // 引数を評価してプッシュ
        arg = node.child;
        while (arg) {
            if (!this.generateExpression(arg)) {
                return false;
            }
            arg = arg.brother;
        }

        // call命令生成
        // 160413: add等のアセンブラ命令と同名の関数があった時にラベルを命令と間違えて誤作動する問題の緊急回避
        const label = `func_${funcName}`;
        this.addCommand("call", label);

        // 返ってきたら、引数/戻り値をポップ
        if (popCount > 0) {
            this.addCommand('pop', popCount, "#引数/戻り値ポップ");
        }

        return true;
    }

    /*
    LeftValue
    Expression
    st
    */
   // E220
    public generateSubstitution(node:any): boolean {
        HLib.assert(node.type === 'SET');

        // 左辺値のアドレスを求める。最初の子が左辺値
        let child = node.child;
        HLib.assert(child);

        // 変数の定義状態を参照
        let v:Variable|null = null;

        if ((child.type === 'OUT') || child.token) { //変数があるなら
            let name = child.token.string;
            if (child.type === 'OUT') {
                name = "!ret";
            }
            v = this.mCurrentBlock.findVariable(name);
            if (!v) {
                // 配列アクセス時でタイプミスすると変数が存在しないケースがある
                this.beginError(child);
                throw `E220:名前付きメモリか定数"${name}"は存在しないか、まだ作られていない。`;
                return false; 
            } else if (!(v.isDefined())) { // 未定義ならここで定義
                v.define();
            }
        }

        const params = {
            staticOffset:0,
            fpRelative:false
        };
        if (!this.pushDynamicOffset(params, child)) {
            return false;
        }

        // 右辺処理
        child = child.brother;
        HLib.assert(child);
        if (!this.generateExpression(child)) {
            return false;
        }

        let cmd;
        if (params.fpRelative) {
            cmd = 'fst';
        } else {
            cmd = 'st';
        }
        this.addCommand(cmd, params.staticOffset, `#"${node.token.string}"へストア`);

        // 左辺値は初期化されたのでフラグをセット。すでにセットされていても気にしない。
        if (v) {
            v.initialize();
        }

        return true;
    }

    //第一項、第二項、第二項オペレータ、第三項、第三項オペレータ...という具合に実行
    public generateExpression(node:any): boolean {
        //解決されて単項になっていれば、そのままgenerateTermに丸投げ。ただし単項マイナスはここで処理。
        let ret = false;
        if (node.type !== 'EXPRESSION') {
            ret = this.generateTerm(node);
        } else {
            if (node.negation) {
                this.addCommand('i', 0, "#()に対する単項マイナス用");
            }
            //項は必ず二つある。
            HLib.assert(node.child);
            HLib.assert(node.child.brother);
            if (!this.generateTerm(node.child)) {
                return false;
            }
            if (!this.generateTerm(node.child.brother)) {
                return false;
            }

            //演算子を適用
            const op = this.getOpFromOperator(node.operator);
            this.addCommand(op);

            //単項マイナスがある場合、ここで減算
            if (node.negation) {
                this.addCommand("sub", '', '#()に対する単項マイナス用');
            }
            ret = true;
        }

        return ret;
    }

    public getOpFromOperator(operator:string): string {
        let op:string;

        const table:any = {
            '+': "add",
            '-': "sub",
            '*': "mul",
            '/': "div",
            '<': "lt",
            '≤': "le",
            '=': "eq",
            '≠': "ne"
        }

        if (!(operator in table)) {
            // これはParserのバグ。とりわけ、LE、GEは前の段階でGT,LTに変換されていることに注意
            HLib.assert(false, `getFromOperator unkown operator: ${operator}`);
        }

        return table[operator];
    }

    // E230
    public generateTerm(node:any): boolean {
        // 単項マイナス処理0から引く
        if (node.negation) {
            // 0をプッシュ
            this.addCommand("i", 0, "#単項マイナス用");
        }

        //タイプで分岐
        if (node.type === 'EXPRESSION') {
            if (!this.generateExpression(node)) {
                return false;
            }
        } else if (node.type === 'NUMBER') {
            // 数値は即値プッシュ
            this.addCommand('i', node.number, "#即値プッシュ");
        } else if (node.type === 'FUNCTION') {
            if (!this.generateFunction(node, false)) {
                return false;
            }
        } else {
            //ARRAY_ELEMENT,VARIABLEのアドレスプッシュ処理

            //変数の定義状態を参照
            if (node.token) { //変数があるなら
                let name = node.token.string;
                if (node.type === "OUT") {
                    name = "!ret";
                }

                let v = this.mCurrentBlock.findVariable(name);
                //知らない変数。みつからないか、あるんだがまだその行まで行ってないか。				
                if (!v) {
                    this.beginError(node);
                    throw `E230:名前付きメモリか定数"${name}"は存在しない。`;
                }

                if (!(v.isDefined())) {
                    this.beginError(node);
                    throw `E231:名前付きメモリか定数"${name}"はまだ作られていない。`;
                }

                if (!(v.isInitialized())) {
                    this.beginError(node);
                    throw `E232: 名前付きメモリか定数"${name}"は数をセットされる前に使われている。「a->a」みたいなのはダメ。`;
                }
            }

            const params = {
                staticOffset: 0,
                fpRelative: false
            };
            if (!this.pushDynamicOffset(params, node)) {
                return false;
            }

            let cmd;
            if (params.fpRelative) {
                cmd = "fld";
            } else {
                cmd = "ld";
            }

            let comment = "\n";
            if (node.token) {
                comment = `#変数"${node.token.string}"からロード`;
            }

            this.addCommand(cmd, params.staticOffset, comment);
        }

        //単項マイナスがある場合、ここで減算
        if (node.negation) {
            this.addCommand("sub", 0, "#単項マイナス用");
        }

        return true;
    }

    public pushDynamicOffset(params:any, node:any): boolean {
        params.fpRelative   = false;
        params.staticOffset = -0x7fffffff; //あからさまにおかしな値を入れておく。デバグのため。

        HLib.assert((node.type === 'OUT') || (node.type === 'VARIABLE') || (node.type === 'ARRAY'));

        //トークンは数字ですか、名前ですか
        if (node.token) {
            if (node.token.type === 'OUT') {
                const name = "!ret";
                const v:any = this.mCurrentBlock.findVariable(name);
                HLib.assert(v);
                params.fpRelative = true; //変数直のみFP相対
                params.staticOffset = v.offset();
                this.mOutputExist = true;
            } else if (node.token.type === 'NAME') {
                //変数の定義状態を参照
                const name = node.token.string;
                const v:any = this.mCurrentBlock.findVariable(name);

                //配列ならExpressionを評価してプッシュ
                if (node.type === 'ARRAY') {
                    this.addCommand('fld', v.offset(), `#ポインタ"${name}"からロード`);

                    if (node.child) { //変数インデクス
                        if (!this.generateExpression(node.child)) { //アドレスオフセットがプッシュされる
                            return false;
                        }
                        this.addCommand("add");
                        params.staticOffset = 0;
                    } else { //定数インデクス
                        params.staticOffset = node.number;
                    }
                } else {
                    params.fpRelative   = true; //変数直のみFP相対
                    params.staticOffset = v.offset();
                }

            }
        } else {
            //定数アクセス。トークンがない。
            HLib.assert(node.type === 'ARRAY'); //インデクスがない定数アクセスはアドレスではありえない。
            if (node.child) { //変数インデクス
                if (!this.generateExpression(node.child)) { //アドレスをプッシュ
                    return false;
                }
            } else {
                this.addCommand("i", 0, "#絶対アドレスなので0\n"); //絶対アドレスアクセス
            }
            params.staticOffset = node.number;
        }

        return true;
    }

    public beginError(node:any): void {
        const token = node.token;
        HLib.assert(token);
    }
}
