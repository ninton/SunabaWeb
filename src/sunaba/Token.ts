import {TokenType} from './TokenType';

export default class Token {
    type:    TokenType;
    line:    number;
    string:  string;
    number:  number|undefined;
    operator:string|undefined;

    constructor(type:TokenType, line:number, string:string, number:number|undefined = undefined) {
        this.type     = type;
        this.line     = line;
        this.string   = string;
        this.number   = number;
    }

    public static createcOperater(line:number, string:string): Token {
        const token = new Token(TokenType.TOKEN_OPERATOR, line, string);
        token.operator = string;
        return token;
    }
}