import {TokenType} from './TokenType';

export default class Token {
    type:    TokenType;
    line:    number;
    string:  string|undefined;
    number:  number|undefined;
    operator:string|undefined;

    constructor(type:TokenType, line:number, string:string|undefined = undefined, number:number|undefined = undefined) {
        this.type     = type;
        this.line     = line;

        if (string !== undefined) {
            this.string   = string;
        }

        if (number !== undefined) {
            this.number   = number;
        }
    }

    public static createcOperater(line:number, string:string): Token {
        const token = new Token(TokenType.TOKEN_OPERATOR, line, string);
        token.operator = string;
        return token;
    }
}