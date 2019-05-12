import Sunaba from './Sunaba';
import Parser from './Parser';
import CodeGenerator from './CodeGenerator';
import Assembler from './Assembler';

export default class Compiler {
    code                :string;
    tokenizedResults    :any;
    structurizedResults :any;
    rootNode            :any;
    parserResults       :any;
    codeGeneratorResults:any;
    assemblerResults    :any;

    constructor() {
        this.code                 = "";
        this.tokenizedResults     = {};
        this.structurizedResults  = {};
        this.rootNode             = {};
        this.parserResults        = {};
        this.codeGeneratorResults = {}
        this.assemblerResults     = {};
    }

    public compile(code:string) {
        let errorMessage = "";

        try {
            this.compileMain(code);
        } catch (e) {
            errorMessage = e;
        }

        return {
            commands: this.assemblerResults.commands,
            errorMessage: errorMessage
        };
    }

    public compileMain(code:string) {
        let s = code;
        s = this.unifySpace(s);
        s = this.unifyNewLine(s);
        s = this.replaceChar(s);
        s = this.unifyOperator(s);
        s = this.removeSingleLineComment(s);
        s = this.removeMultiLineComment(s);
        this.code = s;

        const locale = Sunaba.locales.japanese;

        this.tokenizedResults = this.tokenize(s, locale);

        this.structurizedResults = this.structurize(this.tokenizedResults.tokens);

        const parser:Parser = new Parser(this.structurizedResults.tokens, Sunaba.locales.japanese);
        this.rootNode = parser.parseProgram()

        const codeGenerator = new CodeGenerator((s:string) => {
            console.log(s);
        });

        this.codeGeneratorResults = {
            result: false,
            commands: []
        };
        this.codeGeneratorResults.result = codeGenerator.generateProgram(this.rootNode);
        this.codeGeneratorResults.commands = codeGenerator.getCommands();

        const assembler = new Assembler();
        this.assemblerResults = assembler.assemble(this.codeGeneratorResults.commands);
    }

    public unifySpace(code:string): string {
        // SPEC_CHANGE:タブは8個のスペースとして解釈する
        // 全角スペースは半角2個へ
        const SPACE_8 = "        ";
        const SPACE_2 = "  ";

        let s = code;
        s = s.replace(/\t/g, SPACE_8);
        s = s.replace(/　/g, SPACE_2);
        return s;
    }

    public unifyNewLine(code:string): string {
        // 全てのCR,CRLFをLFに変換する
        const s = code.replace(/\r\n|\r/g, "\n");
        return s;
    }

    public replaceChar(code:string): string {
        // 1.対応する半角文字がある全角文字を全て半角にする
        // 2.制御文字は捨てる

        const len = code.length;

        const u = (s:string): number => {
            return s.charCodeAt(0);
        };
      
        let s:string = "";

        let LOC_ARG_DELIM = "、".charCodeAt(0);

        for (let i = 0; i < len; i += 1) {
            const c:number = code.charCodeAt(i);
            let o:number = c;

            if ((c >= u('Ａ')) && (c <= u('Ｚ'))) {
                o = u('A') + (c - u('Ａ'));
            } else if ((c >= u('ａ')) && (c <= u('ｚ'))) {
                o = u('a') + (c - u('ａ'));
            } else if ((c >= u('０')) && (c <= u('９'))) {
                o = u('0') + (c - u('０'));
            } else if (c === u('\n')) { //改行は残す
                o = c;
            } else if ((c < 0x20) || (c === 0x7f)) {
                ; //0から0x1fまでの制御コードとdelを捨てる。ただし\nは上で処理済み。
            } else if (c === LOC_ARG_DELIM) { //言語ごとの区切り文字
                o = u(',');
            //ASCII範囲
            } else if (c === u('！')) { //0x21
                o = u('!');
            } else if (c === u('”')) { //0x22
                o = u('\"');
            } else if (c === u('＃')) { //0x23
                o = u('#');
            } else if (c === u('＄')) { //0x24
                o = u('$');
            } else if (c === u('％')) { //0x25
                o = u('%');
            } else if (c === u('＆')) { //0x26
                o = u('&');
            } else if (c === u('’')) { //0x27
                o = u('\'');
            } else if (c === u('（')) { //0x28
                o = u('(');
            } else if (c === u('）')) { //0x29
                o = u(')');
            } else if (c === u('＊')) { //0x2a
                o = u('*');
            } else if (c === u('＋')) { //0x2b
                o = u('+');
            } else if (c === u('，')) { //0x2c
                o = u(',');
            } else if (c === u('－')) { //0x2d
                o = u('-');
            } else if (c === u('．')) { //0x2e
                o = u('.');
            } else if (c === u('／')) { //0x2f
                o = u('/');
            } else if (c === u('：')) { //0x3a
                o = u(':');
            } else if (c === u('；')) { //0x3b
                o = u(';');
            } else if (c === u('＜')) { //0x3c
                o = u('<');
            } else if (c === u('＝')) { //0x3d
                o = u('=');
            } else if (c === u('＞')) { //0x3e
                o = u('>');
            } else if (c === u('？')) { //0x3f
                o = u('?');
            } else if (c === u('＠')) { //0x40
                o = u('@');
            } else if (c === u('［')) { //0x5b
                o = u('[');
            } else if (c === u('＼')) { //0x5c
                o = u('\\');
            } else if (c === u('］')) { //0x5d
                o = u(']');
            } else if (c === u('＾')) { //0x5e
                o = u('^');
            } else if (c === u('＿')) { //0x5f
                o = u('_');
            } else if (c === u('‘')) { //0x60
                o = u('`');
            } else if (c === u('｛')) { //0x7b
                o = u('{');
            } else if (c === u('｜')) { //0x7c
                o = u('|');
            } else if (c === u('｝')) { //0x7d
                o = u('}');
            } else if (c === u('～')) { //0x7e
                o = u('~');
            //その他
            } else if (c === u('×')) {
                o = u('*');
            } else if (c === u('÷')) {
                o = u('/');
            } else if (c === u('≧')) {  //日本特有のものを世界的にメジャーなものに変換
                o = u('≥');
            } else if (c === u('≦')) {  //日本特有のものを世界的にメジャーなものに変換
                o = u('≤');
            } else if (c === u('⇒')) {  //代入対応
                o = u('→');
            } else{
                o = c;
            }

            s += String.fromCharCode(o);
        }

        return s;
    }

    public unifyOperator(code:string): string {
        // 演算子統一
        // >=を≥に、 <=を≤に、 !=を≠に、->を→に変換する

        let s = code;

        s = s.replace(/>=/g,   "≥");
        s = s.replace(/<=/g,   "≤");
        s = s.replace(/[!]=/g, "≠");
        s = s.replace(/->/g,   "→");

        return s;
    }

    public removeSingleLineComment(code:string): string {
        // 行末の #コメントを削除する
        const LF = "\n";
        const SHARP = "#";
        const len = code.length;

        let s:string = "";
        let inComment:boolean = false;

        for (let i:number = 0; i < len; i += 1) {
            let ch = code.substr(i, 1);
            if (inComment) {
                if (ch === LF) {
                    s += LF;
                    inComment = false;
                }
            } else {
                if (code[i] === SHARP) {
                    inComment = true;
                } else {
                    s +=  ch;
                }
           }
        }

        return s;
    }

    public removeMultiLineComment(code:string): string {
        const SLASH:string = '/';
        const ASTERISK:string = '*';
        const len:number = code.length;
        let s:string = "";
        let mode:number = 0;

        for (let i = 0; i < len; i += 1) {
            const c = code.substr(i, 1);
            if (mode === 0) {
                if (c === SLASH) {
                    mode = 1;
                } else {
                    s += c;
                }
            } else if (mode === 1) {
                if (c === ASTERISK) {   //コメント成立
                    mode = 2;
                } else {
                    s += SLASH;         //さっきのスラッシュを出力
                    s += c;             //今回の文字を出力
                    mode = 0;
                }
            } else if (mode === 2) {    //コメント中
                if (c === ASTERISK) {   //コメント終了?
                    mode = 3;
                }
            } else if (mode === 3) {    //コメント終了?
                if (c === SLASH) {      //終了！
                    mode = 0;
                }
            } else {
                throw 'BUG';
            }
        }
     
        return s;
    }

    public tokenize(code:string, loc:any): any {
        //トークン分解
        /*
        [モード]
        0 行頭
        1 行頭以外1文字目
        2 文字列
        */
        let tokens:Array<any> = [];
        let msg = "";
        let end = code.length;
        let mode = 0;
        let begin = 0;
        let line = 1;
        const u = function(s:string) { //1文字目のunicodeを返す関数を短く定義
            return s;
        };

        let i = 0;
        while (i < end) {
            let advance = true;
            let c = code[i];
            let l = i - begin; //現時点でのトークン長
            if (mode === 0) {
                if (c === u(' ')) { //空白が続く限り留まる
                    ;
                } else if (c === u('\n')) { //空白しかないまま行を終えたので無視
                    begin = i + 1; //開始
                    line += 1;
                } else { //行頭を出力
                    tokens.push({type:'LINE_BEGIN', line:line, number:l}); //numberに空白数を入れる
                    mode = 1;
                    advance = false; //この文字もう一度
                }
            } else if (mode === 1) { //行頭以外のトークン先頭
                if (c === u('(')) {
                    tokens.push({type:'(', string:'(', line:line});
                } else if (c === u(')')) {
                    tokens.push({type:')', string:')', line:line});
                } else if (c === u('[')) {
                    tokens.push({type:'[', string:'[', line:line});
                } else if (c === u(']')) {
                    tokens.push({type:']', string:']', line:line});
                } else if (c === u(',')) {
                    tokens.push({type:',', string:',', line:line});
                } else if (c === u('→')) {
                    tokens.push({type:'→', string:'→', line:line});
                } else if (c === u('+')) {
                    tokens.push({type:'OPERATOR', operator:'+', string:'+', line:line});
                } else if (c === u('-')) {
                    tokens.push({type:'OPERATOR', operator:'-', string:'-', line:line});
                } else if (c === u('*')) {
                    tokens.push({type:'OPERATOR', operator:'*', string:'*', line:line});
                } else if (c === u('/')) {
                    tokens.push({type:'OPERATOR', operator:'/', string:'/', line:line});
                } else if (c === u('=')) {
                    tokens.push({type:'OPERATOR', operator:'=', string:'=', line:line});
                } else if (c === u('≠')) {
                    tokens.push({type:'OPERATOR', operator:'≠', string:'≠', line:line});
                } else if (c === u('<')) {
                    tokens.push({type:'OPERATOR', operator:'<', string:'<', line:line});
                } else if (c === u('>')) {
                    tokens.push({type:'OPERATOR', operator:'>', string:'>', line:line});
                } else if (c === u('≤')) {
                    tokens.push({type:'OPERATOR', operator:'≤', string:'≤', line:line});
                } else if (c === u('≥')) {
                    tokens.push({type:'OPERATOR', operator:'≥', string:'≥', line:line});
                } else if (c === u('\n')) { //行末
                    mode = 0;
                    begin = i + 1;
                    line += 1;
                } else if (c ===u(' ')) { //空白が来た
                    ; //何もしない
                } else if (Sunaba.isInName(c)) { //識別子開始
                    mode = 2;
                    begin = i;
                } else{
                    msg = `E001: 行{$line}: Sunabaで使うはずのない文字"${c}"が出てきた。\n`;
                    if (c === ';') {
                        msg += 'C言語と違って文末の;は不要。';
                    } else if ((c === '{') || (c === '}')) {
                        msg += 'C言語と違って{や}は使わない。行頭の空白で構造を示す。';
                    }
                    break;
                }
            } else if (mode === 2) { //識別子
                if (Sunaba.isInName(c)) { //続く
                    ;
                } else { //その他の場合、出力
                    let str = code.substr(begin, l);
                    let keyword = Sunaba.readKeyword(str, loc); //キーワード
                    if (keyword !== "") {
                        tokens.push({type:keyword, string:str, line:line});
                    } else {
                        let number = Sunaba.readNumber(code, begin, l);
                        if (number !== null) {
                            if (Math.abs(number) > Sunaba.MAX_ABS_NUMBER) {
                                msg = `E002: 行{$line}: Sunabaでは扱えない大きな数${number}が現れました。\n`;
                                msg += `プラスマイナス${Sunaba.MAX_ABS_NUMBER}の範囲しか使えません。`;
                                break;
                            } else {
                                tokens.push({type:'NUMBER', number:number, string:str, line:line});
                            }
                        } else { //キーワードでも数字でもないので名前
                            tokens.push({type:'NAME', string:str, line:line});
                        }
                    }
                    mode = 1;
                    advance = false; //もう一回この文字から回す
                }
            } else{
                throw 'BUG: Compiler.ts:400';
            }

            if (advance) {
                i += 1;
            }
        }

        if (0 < msg.length) {
            throw msg;
        }

        return {tokens:tokens, errorMessage:msg};
    }

    public structurize(tokens:Array<any>): any {
        let r:Array<any> = [];
        let spaceCountStack = [0];
        let spaceCountStackPos:number = 1;
        let parenLevel:number = 0;
        let braceLevel:number = 0;
        let msg = '';
        let prevT = null;
        let emptyLine = true; //最初は空

        for (let i = 0; i < tokens.length; i += 1) {
            let t = tokens[i];
            if (t.type === '(') {
                parenLevel += 1;
            } else if (t.type === ')') {
                parenLevel -= 1;
                if (parenLevel < 0) {
                    msg = `E010: 行${t.line}: )が(より多い。`;
                    break;
                }
            } else if (t.type === '[') {
                braceLevel += 1;
            } else if (t.type === ']') {
                braceLevel -= 1;
                if (braceLevel < 0) {
                    msg = `E011: 行:${t.line}: ]が[より多い。`;
                    break;
                }
            }

            if (t.type === 'LINE_BEGIN') { //行頭
                let prevIsOp = false; //前のトークンは演算子か代入か？
                if ((prevT !== null) && ((prevT.type === 'OPERATOR') || (prevT.type === '→'))) {
                    prevIsOp = true;
                }

                //()や[]の中におらず、前のトークンが演算子や代入記号でなければ、
                if ((parenLevel === 0) && (braceLevel === 0) && (!prevIsOp)) {
                    let newCount = t.number;
                    let oldCount = spaceCountStack[spaceCountStackPos - 1];
                    if (newCount > oldCount) { //増えた
                        spaceCountStack[spaceCountStackPos] = newCount;
                        spaceCountStackPos += 1;
                        r.push({type:'{', string:'{', line:t.line});
                    } else if (newCount === oldCount) {
                        if (!emptyLine) { //空行でなければ
                        r.push({type:';', string:';', line:t.line});
                        emptyLine = true;
                        }
                    } else{ //newCount < oldCount
                        if (!emptyLine) { //空行でなければ
                            r.push({type:';', string:';', line:t.line});
                            emptyLine = true;
                        }
                        while (newCount < oldCount) { //ずれてる間回す
                            spaceCountStackPos -= 1;
                            if (spaceCountStackPos < 1) { //ありえない
                                throw 'BUG: compipler.ts:472';
                            }
                            oldCount = spaceCountStack[spaceCountStackPos - 1];
                            r.push({type:'}', string:'}', line:t.line});
                        }

                        if (newCount != oldCount) { //ずれている
                            msg = `E012: 行${t.line}: 字下げが不正。ずれてるよ。前の深さに合わせてね。`;
                            break;
                        }
                    }
                }
            } else {
                r.push(t); //そのまま移植
                emptyLine = false; //空行ではなくなった
            }
            prevT = t;
        }

        if (!emptyLine) { //最後の行を終わらせる
            r.push({type:';', string:'行末', line:prevT.line});
        }

        //ブロック終了を補う
        while (spaceCountStackPos > 1) {
            spaceCountStackPos -= 1;
            r.push({type:'}', string:'ブロック末', line:prevT.line});
        }

        //ダミー最終トークン
        r.push({type:'END', string:"", line:tokens[tokens.length - 1].line});

        if (0 < msg.length) {
            throw msg;
        }

        return {
            errorMessage: msg,
            tokens: r
        };
    }

}
