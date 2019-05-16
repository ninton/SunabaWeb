import { TokenType } from './TokenType';
import Token from './Token';
import Locale from './Locale';

export default class Sunaba {
    static MAX_ABS_NUMBER = 2147483647; //2^31 - 1

    //Sunaba.Locale
    static locales:{[key:string]:Locale;} = {
        japanese: {
            whileWord0:   'なかぎり',
            whileWord1:   'な限り',
            whileAtHead:  false,
            ifWord:       'なら',
            ifAtHead:     false,
            defWord:      'とは',
            defAtHead:    false,
            constWord:    '定数',
            outWord:      '出力',
            memoryWord:   'メモリ',
            argDelimiter: '、'
        }
    };
 
    //識別子に含まれる文字か否か
    public static isInName(code:string): boolean {
        return (code === '@') ||
        (code === '$') ||
        (code === '&') ||
        (code === '?') ||
        (code === '_') ||
        (code === '\'') ||
        ((code >= 'a') && (code <= 'z')) ||
        ((code >= 'A') && (code <= 'Z')) ||
        ((code >= '0') && (code <= '9')) ||
        (code.charCodeAt(0) >= 0x100); //マルチバイト文字は全てオーケー。半角相当品がある全角は置換済み。
    };
 
    public static readKeyword = function(s:string, loc:Locale): TokenType {
        let r:TokenType;

        if (s === 'while') {
            r = TokenType.TOKEN_WHILE_PRE;
        } else if ((s === loc.whileWord0) || (s === loc.whileWord1)) {
            r = (loc.whileAtHead) ? TokenType.TOKEN_WHILE_PRE : TokenType.TOKEN_WHILE_POST;
        } else if (s === 'if') {
            r = TokenType.TOKEN_IF_PRE;
        } else if (s === loc.ifWord) {
            r = (loc.ifAtHead) ? TokenType.TOKEN_IF_PRE : TokenType.TOKEN_IF_POST;
        } else if (s === 'def') {
            r = TokenType.TOKEN_DEF_PRE;
        } else if (s === loc.defWord) {
            r = (loc.defAtHead) ? TokenType.TOKEN_DEF_PRE : TokenType.TOKEN_DEF_POST;
        } else if ((s === 'const') || (s === loc.constWord)) {
            r = TokenType.TOKEN_CONST;
        } else if ((s === 'out') || (s === loc.outWord)) {
            r = TokenType.TOKEN_OUT;
        } else{
            r = TokenType.TOKEN_UNKNOWN;
        }
        return r;
    };
 
    public static readInstruction(s:string): string {
        //線形検索だけどコードが短い方を選んだ。ハッシュにしても良い。
        var table = [
            'i', 'add', 'sub', 'mul', 'div', 'lt', 'le', 'eq', 'ne',
            'ld', 'st', 'fld', 'fst', 'j', 'bz', 'call', 'ret', 'pop'
        ];
    
        var n = table.length;
        for (var i = 0; i < n; i += 1){
            if (s === table[i]) {
                return table[i];
            }
        }

        return "";
    }
 
    //マイナスも読めます(主に速度とデバグのために)
    public static readNumber(code:string, begin:number, l:number): number {
        //前提。lは0じゃない。空白は混ざっていない。
        var r = 0;
        var i = 0;
        var minus = false;

        if (code.substr(begin + i, 1) === '-') { //マイナスですね
            i += 1;
            minus = true;
        }
        var u0 = '0';
        var u9 = '9';
        var decimalExist = false;
        while (i < l){
            r *= 10;
            var c = code.substr(begin + i, 1);
            if ((c >= u0) && (c <= u9)){
                r += c.charCodeAt(0) - u0.charCodeAt(0);
                decimalExist = true;
            } else {
                break;
            }
            i += 1;
        }
        if (decimalExist) { //数字が存在している
            r = (minus) ? -r : r;
        } else {
            r = null; //数字がなかった。nullを返す。
        }

        return r;
    };
}