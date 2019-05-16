/* eslint no-unused-vars: 0 */

import Token from './Token';
import TokenType from './TokenType';
import { NodeType } from './NodeType';

export default class Node {
  type:     NodeType;
  child:    Node|null;
  brother:  Node|null;
  number:   number;
  token:    Token|null;
  operator: string;
  negation: boolean;

  constructor(type:NodeType, token:Token|null = null, child:Node|null = null, brother:Node|null = null) {
    this.type     = type;
    this.token    = token;
    this.child    = child;
    this.brother  = brother;
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
    const node:Node = new Node(NodeType.NODE_NUMBER);
    node.token   = token;
    node.number  = number || 0;
    node.child   = child;
    node.brother = brother;

    return node;
  }

  public isOutputValueSubstitution(): boolean {
    if (this.token === null) {
      return false;
    }

    return this.token.type === TokenType.TOKEN_OUT;
  }
}
