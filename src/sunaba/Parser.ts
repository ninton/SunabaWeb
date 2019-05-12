import HLib from './HLib';
import { stat } from 'fs';

export default class Parser {
    errorMessage:string;
    mTokens:Array<any>;
    mLocale:any;
    mConstants:any;
    mRoot:any;
    mPos:number;

    constructor(tokens:Array<any>, locale:any) {
        this.errorMessage = null;

        this.mTokens = tokens;
        this.mLocale = locale;
        this.mConstants = {};
        this.mRoot = null;
        this.mPos = 0;
    }

    //Program : (Const | FuncDef | Statement )*
    public parseProgram() {
        // 定数マップに「メモリ」と「memory」を登録
        this.mConstants.memory = 0;
        let memoryWord = this.mLocale.memoryWord;
        this.mConstants[memoryWord] = 0;
        this.mConstants["memory"] = 0;

        // Programノードを確保
        let node:any = {type:'PROGRAM', child:null, brother:null};

        // 定数全て処理
        // このループを消して、後ろのループのparseConstのtrueを消せば、定数定義を前に限定できる
        let tokens = this.mTokens;
        let n = tokens.length;
        this.mPos = 0;
        while (tokens[this.mPos].type !== 'END') {
            let t = tokens[this.mPos];
            if (t.type === 'CONST') {
                if (!this.parseConst(false)) { //ノードを返さない。
                    return null;
                }
            } else {
                this.mPos += 1;
            }
        }

        //残りを処理
        this.mPos = 0;
        let lastChild:any = null;
        while (tokens[this.mPos].type !== 'END') {
            let statementType = this.getStatementType();
            let child = null;
            if (statementType === null) {
                return null;
            } else if (statementType === 'CONST') { //定数は処理済みなのでスキップ
                if (!this.parseConst(true)) {
                    return null;
                }
            } else {
                if (statementType === 'DEF') {
                    child = this.parseFunctionDefinition();
                } else {
                    child = this.parseStatement();
                }

                if (child === null) {
                    return null;
                } else if (!lastChild) {
                    node.child = child;
                } else {
                    lastChild.brother = child;
                }
                lastChild = child;
            }
        }

        return node;
     }

    // Const : const name -> expression;
    // ノードを生成しないので、boolを返す。
    public parseConst(skipFlag:boolean): boolean {
        let tokens:Array<any> = this.mTokens;
        let t = tokens[this.mPos];

        if (t.type !== 'CONST') {
            this.beginError(t);
            throw `E101: 定数行のはずだが解釈できない。上の行からつながってないか。`;
        }
        HLib.assert(t.type === 'CONST');
        this.mPos += 1;

        //名前
        t = tokens[this.mPos];
        if (t.type !== 'NAME') {
            this.beginError(t);
            throw `E102: 行${t.line}: 定数"の次は定数名。"${t.string}"は定数名と解釈できない。`;
        }
        let constName = t.name;
        this.mPos += 1;

        //→
        t = tokens[this.mPos];
        if (t.type !== '→') {
            this.beginError(t);
            throw `E103: 行${t.line}: 定数 [名前]、と来たら次は"→"のはずだが「${t.string}'」がある。`;
            return false;
        }
        this.mPos += 1;

        // Expression
        let expression = this.parseExpression();
        if (expression === null) {
            return false;
        }

        if (expression.type !== 'NUMBER') {  // 数字に解決されていなければ駄目。
            this.beginError(t);
            throw `E104: 行${t.line}: 定数の右辺の計算に失敗した。メモリや名前つきメモリ、部分プログラム参照などが入っていないか？`;
        }
        let constValue = expression.number;
        // this.mPos += 1; // C#版は += 1していないのでコメント化した

        //文末
        t = tokens[this.mPos];
        if (t.type !== ';') {
            this.beginError(t);
            throw `行${t.line}: 定数作成の後に"${t.string}"がある。改行してくれ。\n`;
        }
        this.mPos += 1;

        //マップに登録
        if (!skipFlag) {
            if (constName in this.mConstants) { //もうある
                throw `E105: 行${t.line}: 定数「${constName}」はすでに同じ名前の定数がある。`;
            }
            this.mConstants[constName] = constValue;
        }

        return true;
    }

    //FunctionDefinition : name ( name? [ , name ]* ) とは [{ statement* }]
    //FunctionDefinition : def name ( name? [ , name ]* ) [{ statement* }]
    public parseFunctionDefinition() {
        //defスキップ
        let tokens = this.mTokens;
        let t = tokens[this.mPos];
        let defFound = false;
        if (t.type === 'DEF_PRE') {
            this.mPos += 1;
            defFound = true;
            t = tokens[this.mPos];
        }
        //ノード準備
        let node:any = {type:'FUNC_DEF', token:t, child:null, brother:null};
        this.mPos += 1;

        //(
        t = tokens[this.mPos];
        if (t.type !== '(') {
            throw `E110: 行${t.line}: 入力リスト開始の「(」があるはずだが、「${t.string}」がある。`;
        }
        this.mPos += 1;

        //次がnameなら引数が一つはある
        let lastChild:any = null;
        t = tokens[this.mPos];
        if (t.type === 'NAME') {
            let arg = this.parseVariable();
            if (arg === null) {
                return null;
            }

            node.child = arg;
            lastChild = arg;
            //第二引数以降を処理
            while (tokens[this.mPos].type === ',') {
                this.mPos += 1;
                t = tokens[this.mPos];
                if (t.type !== 'NAME') { //名前でないのはエラー
                    throw `E111: 行${t.line}: 入力リスト中に「,」がある以上、まだ入力があるはずだが、「${t.string}」がある。`;
                }

                arg = this.parseVariable();
                if (arg === null) {
                    return null;
                }

                //引数名が定数なのは許さない
                t = tokens[this.mPos];
                if (arg.type === 'NUMBER') { //定数は構文解析中に解決されてNUMBERになってしまう。
                    throw `E112: 行${t.line}: 定数と同じ名前は入力につけられない。`;
                }
                lastChild.brother = arg;
                lastChild = arg;
            }
        }
        //)
        t = tokens[this.mPos];
        if (t.type !== ')') {
            throw `E113: 行${t.line}: 入力リスト終了の「)」があるはずだが、「' + t.string + '」がある。`;
        }
        this.mPos += 1;

        //とは
        t = tokens[this.mPos];
        if (t.type === 'DEF_POST') {
            if (defFound) {
                throw `E114: 行${t.line}: 「def」と「とは」が両方ある。片方にしてほしい。`;
            }
            defFound = true;
            this.mPos += 1;
        }

        //関数定義の中身
        t = tokens[this.mPos];
        if (t.type === '{') {
            this.mPos += 1;
            t = tokens[this.mPos];
            while (true) {
                let child = null;
                if (t.type === '}') { //終わり
                    this.mPos += 1;
                    break;
                } else if (t.type === 'CONST') { //定数は関数定義の中では許しませんよ
                    throw `E115: 行${t.line}: 部分プログラム内で定数は作れない。`;
                } else {
                    child = this.parseStatement();
                    if (child === null) {
                        return null;
                    }
                }
                
                if (lastChild !== null) {
                    lastChild.brother = child;
                } else {
                    node.child = child;
                }

                lastChild = child;
            }
        } else if (t.type === ';') { //いきなり空
            this.mPos += 1;
        } else { //エラー
            throw `E116: 行${t.line}: 部分プログラムの最初の行の行末に「${t.string}」が続いている。改行しよう。`;
        }

        return node;
    }

    //Statement : ( while | if | return | funcDef | func | set )
    public parseStatement() {
        let statementType = this.getStatementType();
        let node = null;
        let t = null;
        if (statementType === 'WHILE_OR_IF') {
            node = this.parseWhileOrIfStatement();
        } else if (statementType === 'DEF') { //これはエラー
            t = this.mTokens[this.mPos];
            throw 'E120: 行' + t.line + ': 部分プログラム内で部分プログラムは作れない。';
            return null;
        } else if (statementType === 'CONST') { //これはありえない
            throw 'BUG parseStatement CONST';
        } else if (statementType === 'FUNC') { //関数呼び出し文
            node = this.parseFunction();
            if (node === null) {
                return null;
            }

            t = this.mTokens[this.mPos];
            if (t.type !== ';') { //文終わってないぞ
                if (t.type === '{') {
                    throw 'E121: 行' + t.line + ': 部分プログラムを作ろうとした？それは部分プログラムの外で「def」なり「とは」なりを使ってね。それとも、次の行の字下げが多すぎただけ？';
                } else {
                    throw 'E122: 行' + t.line + ': 部分プログラム参照の後ろに、「' + t.string + '」がある。改行したら？';
                }
            }

            this.mPos += 1;
        } else if (statementType === 'SET') { //代入
            node = this.parseSetStatement();
        } else if (statementType === null) { //不明。エラー文字列は作ってあるので上へ
            return null;
        } else {
            throw 'BUG parseStatement #1';
        }
        return node;     
    }

    //文タイプを判定
    //DEF, FUNC, WHILE_OR_IF, CONST, SET, nullのどれかが返る。メンバは変更しない。
    public getStatementType() {
        let pos = this.mPos; //コピーを作ってこっちをいじる。オブジェクトの状態は変えない。
        let tokens = this.mTokens;
        let t = tokens[pos];
        //文頭でわかるケースを判別
        if (t.type === '{') {
            throw 'E130: 行' + t.line + ': 字下げを間違っているはず。上の行より多くないか。';
            return null;
        } else if ((t.type === 'WHILE_PRE') || (t.type === 'IF_PRE')) {
            return 'WHILE_OR_IF';
        } else if (t.type === 'DEF') {
            return 'DEF';
        } else if (t.type === 'CONST') {
            return 'CONST';
        }
        //文末までスキャン
        let endPos = pos;
        while ((tokens[endPos].type !== ';') && (tokens[endPos].type !== '{')) {
            endPos += 1;
        }
        //後置キーワード判定
        if (endPos > pos) {
            t = tokens[endPos - 1];
            if ((t.type === 'WHILE_POST') || (t.type === 'IF_POST')) {
                return 'WHILE_OR_IF';
            } else if (t.type === 'DEF_POST') {
                return 'DEF';
            }
        }
        //代入記号を探す
        for (let i = pos; i < endPos; i += 1) {
            if (tokens[i].type === '→') {
                return 'SET';
            }
        }
        //残るは関数コール文?
        if ((tokens[pos].type === 'NAME') && (tokens[pos + 1].type === '(')) {
            return 'FUNC';
        }

        //解釈不能。ありがちなのは「なかぎり」「なら」の左に空白がないケース
        throw 'E131: 行' + t.line + ': 解釈できない。注釈は//じゃなくて#だよ？あと、「なかぎり」「なら」の前には空白ある？それと、メモリセットは=じゃなくて→だよ？';
        //TODO: どんなエラーか推測してやれ
        //TODO: 後ろにゴミがあるくらいなら無視して進む手もあるが、要検討
    }

    //Set: [out | memory | name | array] → expression ;
    public parseSetStatement() {
        //
        let tokens = this.mTokens;
        let t = tokens[this.mPos];
        if ((t.type !== 'NAME') && (t.type !== 'OUT')) {
            throw 'E140: 行' + t.line + ': 「→」があるのでメモリセット行だと思うが、それなら「memory」とか「out」とか、名前付きメモリの名前とか、そういうものから始まるはず。'
        }
        let node = {type:'SET', token:t, child:null, brother:null};

        // 左辺
        let left:any = null;
        if (t.type === 'OUT') {
            left = {type:'OUT', token:t, child:null, brother:null};
            this.mPos += 1;
        } else {
            // 第一要素はNAME
            if (tokens[this.mPos + 1].type === '[') {
                // 配列だ
                left = this.parseArray();
            } else { // 変数
                left = this.parseVariable();
                if (left.type === 'NUMBER') {
                    //定数じゃん！
                    throw 'E141: 行' + t.line + ': ' + left.string + 'は定数で、セットできない。';
                }
            }
        }
        if (left === null) {
            return null;
        }
        node.child = left;
        
        // →
        t = tokens[this.mPos];
        if (t.type !== '→') {
            throw 'E142: 行' + t.line + ': メモリセット行だと思ったのだが、あるべき場所に「→」がない。';
        }
        this.mPos += 1;

        // 右辺は式
        let right = this.parseExpression();
        if (right === null) {
            return null;
        }
        left.brother = right;

        // ;
        t = tokens[this.mPos];
        if (t.type !== ';') {
            throw 'E143: 行' + t.line + ': 次の行の字下げが多すぎるんじゃなかろうか。';
        }
        this.mPos += 1;

        return node;
    }

    //while|if expression [ { } ]
    //while|if expression;
    //expression while_post|if_post [ { } ]
    //expression while_post|if_post ;
    public parseWhileOrIfStatement() {
        let tokens = this.mTokens;
        let t = tokens[this.mPos];
        let node:any = {type:null, token:t, child:null, brother:null};
        //前置ならすぐ決まる
        if (t.type === 'WHILE_PRE') {
            node.type = 'WHILE';
            this.mPos += 1;
        } else if (t.type === 'IF_PRE') {
            node.type = 'IF';
            this.mPos += 1;
        }
        //条件式
        let exp = this.parseExpression();
        if (exp === null) {
            return null;
        }
        node.child = exp;
     
        //まだどっちか確定してない場合、ここにキーワードがあるはず
        t = tokens[this.mPos];
        if (node.type === null) {
            if (t.type === 'WHILE_POST') {
                node.type = 'WHILE';
            } else if (t.type === 'IF_POST') {
                node.type = 'IF';
            }
            this.mPos += 1;
        }

        //ブロックがあるなら処理
        t = tokens[this.mPos];
        if (t.type === '{') {
            this.mPos += 1;
            let lastChild = exp;
            while (true) {
                let child = null;
                t = tokens[this.mPos];
                if (t.type === '}') {
                    this.mPos += 1;
                    break;
                } else if (t.type === 'CONST') {
                    throw 'E150: 行' + t.line + ': 繰り返しや条件実行の中で定数は作れない。';
                } else {
                    child = this.parseStatement();
                }

                if (child === null) {
                    return null;
                }
                lastChild.brother = child;
                lastChild = child;
            }
        } else if (t.type === ';') { //中身なしwhile/if
           this.mPos += 1;
        } else {
           throw 'E151: 行' + t.line + ': 条件行は条件の終わりで改行しよう。「' + t.string + '」が続いている。';
        }

        return node;
    }

    // Array : name [ expression ]
    public parseArray() {
        let node:any = this.parseVariable();
        if (node === null) {
            return null;
        }
        node.type = 'ARRAY';

        // [
        HLib.assert(this.mTokens[this.mPos].type === '['); // getTermTypeで判定済み
        this.mPos += 1;

        // expression
        let expression:any = this.parseExpression();
        if (expression === null) {
            return null;
        }
        node.child = expression;

        // expressionが数値であれば、アドレス計算はここでやる
        if (expression.type === 'NUMBER') {
            node.number += expression.number;
            node.child = null; // 子のExpressionを破棄
        }

        //]
        if (this.mTokens[this.mPos].type !== ']') {
            let t = this.mTokens[this.mPos];
            this.beginError(t);
            throw `E160: 行${t.line}: 名前つきメモリ[番号]の"]"の代わりに"${t.string}"がある。\n`;
        }
        this.mPos += 1;

        return node;
    }
 
    // Variable : name
    public parseVariable() {
        let t = this.mTokens[this.mPos];
        HLib.assert(t.type === 'NAME');
        let node:any = {type:null, token:null, child:null, brother:null};

        //定数？変数？
        let c = this.mConstants[t.string];
        if (typeof c !== 'undefined') {
            node.type = 'NUMBER';
            node.number = c;
        } else {
            node.type = 'VARIABLE';
            node.token = t;
        }
        this.mPos += 1;

        return node;
    };
    
    //Out : out
    public parseOut() {
        let t = this.mTokens[this.mPos];
        HLib.assert(t.type === 'OUT');
        let node = {type:'OUT', token:t, child:null, brother:null};
        this.mPos += 1;
        return node;
    }
    
    // Expression : expression +|-|*|/|<|>|≤|≥|≠|= expression
    // 左結合の木になる。途中で回転が行われることがある。
    // E170
    public parseExpression() {
        // ボトムアップ構築して、左結合の木を作る。
	    // 最初の左ノードを生成
        let left:any = this.parseTerm();
        if (left === null) {
            return null;
        }

        // 演算子がつながる限りループ
        for (let t = this.mTokens[this.mPos]; t.type === 'OPERATOR'; t = this.mTokens[this.mPos]) {
            let node:any = {
                type:'EXPRESSION',
                token:t,
                operator:t.operator,
                child:null,
                brother:null
            };
            this.mPos += 1;
            t = this.mTokens[this.mPos];
            if ((t.type === 'OPERATOR') && (t.operator !== '-')) { //-以外の演算子ならエラー
                throw 'E170: 行' + t.line + ': 演算子が連続している。==や++や--はない。=>や=<は>=や<=の間違いだろう。';
            }
            let right = this.parseTerm();
            if (right === null) {
                return null;
            }

            //GT,GEなら左右交換して不等号の向きを逆に
            if ((node.operator === '>') || (node.operator === '≥')) {
                let tmp = left;
                left = right;
                right = tmp;
                if (node.operator === '>') {
                    node.operator = '<';
                } else {
                    node.operator = '≤';
                }
            }

            // 最適化。定数の使い勝手向上のために必須 TODO:a + 2 + 3がa+5にならないよねこれ
            let preComputed = null;
            if ((left.type === 'NUMBER') && (right.type === 'NUMBER')) {
                let a = left.number;
                let b = right.number;
                if (node.operator === '+') {
                    preComputed = a + b;
                } else if (node.operator === '-') {
                    preComputed = a - b;
                } else if (node.operator === '*') {
                    preComputed = a * b;
                } else if (node.operator === '/') {
                    preComputed = Math.floor(a / b); //整数化必須
                } else if (node.operator === '<') {
                    preComputed = (a < b) ? 1 : 0;
                } else if (node.operator === '≤') {
                    preComputed = (a <= b) ? 1 : 0;
                } else if (node.operator === '=') {
                    preComputed = (a === b) ? 1 : 0;
                } else if (node.operator === '≠') {
                    preComputed = (a !== b) ? 1 : 0;
                } else {
                    throw 'BUG parseExpression #1'; //>と≥は上で置換されてなくなっている
                }
            }

            if (preComputed !== null) { //事前計算でノードをマージ
                node.type = 'NUMBER';
                node.number = preComputed;
            } else {
                node.child = left;
                left.brother = right;
            }
            //現ノードを左の子として継続
            left = node;
        }

        return left;
    }
    
    public getTermType() {
        let t = this.mTokens[this.mPos];
        let r = null;

        if (t.type === '(') {
            r = 'EXPRESSION';
        } else if (t.type === 'NUMBER') {
            r = 'NUMBER';
        } else if (t.type === 'NAME') {
            t = this.mTokens[this.mPos + 1];
            if (t.type === '(') {
                r = 'FUNC';
            } else if (t.type === '[') {
                r = 'ARRAY';
            } else {
                r = 'VARIABLE';
            }
        } else if (t.type === 'OUT') {
            r = 'OUT';
        }

        return r;
    };
    
    //Term : [-] function|variable|out|array|number|(expression)
    // E180
    public parseTerm() {
        let t = this.mTokens[this.mPos];
        let minus = false;

        if (t.operator === '-') {
            minus = true;
            this.mPos += 1;
        }

        t = this.mTokens[this.mPos];
        let termType = this.getTermType();
        let node = null;
        if (termType === 'EXPRESSION') {
            HLib.assert(t.type === '(');
            this.mPos += 1;
            node = this.parseExpression();
            t = this.mTokens[this.mPos];
            if (t.type !== ')') {
                throw 'E180: 行' + t.line + ': ()で囲まれた式がありそうなのだが、終わりの")"の代わりに「' + t.string + '」がある。';
            }
            this.mPos += 1;
        } else if (termType === 'NUMBER') {
            node = {type:'NUMBER', number:t.number, token:t, child:null, brother:null};
            this.mPos += 1;
        } else if (termType === 'FUNC') {
            node = this.parseFunction();
        } else if (termType === 'ARRAY') {
            node = this.parseArray();
        } else if (termType === 'VARIABLE') {
            node = this.parseVariable();
        } else if (termType === 'OUT') {
            node = this.parseOut();
        } else {
            throw `E181: 行${t.line}: ここには、()で囲まれた式、memory[]、数、名前つきメモリ、部分プログラム参照、のどれかがあるはずなのだが、代わりに「${t.string}」がある。`;
        }

        if ((node !== null) && minus) {
            if (node.type === 'NUMBER') { //この場で反転
                node.number = -(node.number);
            } else { //反転は後に伝える
                node.negation = true;
            }
        }
        return node;
    };
    
    //Function : name ( [ expression [ , expression ]* ] )
    // E190
    public parseFunction() {
        let t = this.mTokens[this.mPos];
        HLib.assert(t.type === 'NAME');
        let node = {type:'FUNC', token:t, child:null, brother:null};
        this.mPos += 1;
    
        //(
        t = this.mTokens[this.mPos];
        HLib.assert(t.type === '(');
        this.mPos += 1;
    
        //引数ありか、なしか
        t = this.mTokens[this.mPos];
        if (t.type !== ')') { //括弧閉じないので引数あり
        let exp = this.parseExpression();
        if (exp === null) {
            return null;
        }
        node.child = exp;
    
        //2個目以降はループで取る
        let lastChild = exp;
        while (true) {
            t = this.mTokens[this.mPos];
            if (t.type !== ',') {
                break;
            }
            this.mPos += 1;
            exp = this.parseExpression();
            if (exp === null) {
                return null;
            }
            lastChild.brother = exp;
            lastChild = exp;
        }
        }

        //)
        if (t.type !== ')') {
            throw 'E190: 行' + t.line + ': 部分プログラムの入力が")"で終わるはずだが、「' + t.string + '」がある。';
        }
        this.mPos += 1;
        return node;
    }

    public beginError(node:any) {
    }
}
