export default class Compiler {
    public compile(code:string) {
        let s = code;
        s = this.unifySpace(s);
        s = this.unifyNewLine(s);
        s = this.replaceChar(s);
        s = this.unifyOperator(s);
        s = this.removeSingleLineComment(s);
        s = this.removeMultiLineComment(s);
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

        var LOC_ARG_DELIM = "、".charCodeAt(0);

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

        for (let i = 0; i < len; i += 1){
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
}
