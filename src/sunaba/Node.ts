import HLib from './HLib';
import { stat } from 'fs';
import Token from './Token';
import { TokenType } from './TokenType';
import { TermType, StatementType, NodeType } from './NodeType';

export class Node {
    type    : NodeType;
    child   : Node|null;
    brother : Node|null;
    number  : number;
    token   : Token|null;
    operator: string;
    negation: boolean;

    constructor(type:NodeType) {
        this.type     = type;
        this.child    = null;
        this.brother  = null;
        this.token    = null;
        this.operator = '';
        this.number   = 0;
        this.negation = false;
    }

    public static createExpression(token:Token, operator:string, child:Node|null, brother:Node|null): Node {
        const node:Node = new Node(NodeType.NODE_EXPRESSION);
        node.token    = token;
        node.operator = operator;
        node.child    = child;
        node.brother  = brother;

        return node;
    }

    public static createNumber(token:Token, number:number|undefined, child:Node|null, brother:Node|null): Node {
        const node:Node = new Node(NodeType.NODE_EXPRESSION);
        node.token    = token;
        node.number   = number || 0;
        node.child    = child;
        node.brother  = brother;

        return node;
    }
}