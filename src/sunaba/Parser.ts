import HLib from './HLib';
import Token from './Token';
import TokenType from './TokenType';
import { TermType, StatementType, NodeType } from './NodeType';
import Node from './Node';

export default class Parser {
  errorMessage: string;
  mTokens   : Array<Token>;
  mLocale   : any;
  mConstMap   : any;
  mPos    : number;

  constructor(tokens:Array<Token>, locale:any) {
    this.errorMessage = '';
    this.mTokens  = tokens;
    this.mLocale  = locale;
    this.mConstMap  = {};
    this.mPos     = 0;
  }

  // Program : (Const | FuncDef | Statement )*
  public parseProgram(): Node|null {
    // 定数マップに「メモリ」と「memory」を登録
    this.mConstMap.memory = 0;
    const { memoryWord } = this.mLocale;
    this.mConstMap[memoryWord] = 0;

    // Programノードを確保
    // let node:Node = {type:'PROGRAM', child:null, brother:null};
    const node:Node = new Node(NodeType.NODE_PROGRAM);

    // 定数全て処理
    // このループを消して、後ろのループのparseConstのtrueを消せば、定数定義を前に限定できる
    const tokens:Array<Token> = this.mTokens;
    this.mPos = 0;
    while (tokens[this.mPos].type !== TokenType.TOKEN_END) {
      const t:Token = tokens[this.mPos];
      if (t.type === TokenType.TOKEN_CONST) {
        if (!this.parseConst(false)) { // ノードを返さない。
          return null;
        }
      } else {
        this.mPos += 1;
      }
    }

    // 残りを処理
    this.mPos = 0;
    let lastChild:Node|null = null;
    while (tokens[this.mPos].type !== TokenType.TOKEN_END) {
      const statementType:StatementType = this.getStatementType();
      let child:Node|null = null;
      if (statementType === null) {
        return null;
      } else if (statementType === StatementType.STATEMENT_CONST) { // 定数は処理済みなのでスキップ
        if (!this.parseConst(true)) {
          return null;
        }
      } else {
        if (statementType === StatementType.STATEMENT_DEF) {
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
    const tokens:Array<Token> = this.mTokens;
    let t:Token = tokens[this.mPos];

    if (t.type !== TokenType.TOKEN_CONST) {
      throw new Error('E101: 定数行のはずだが解釈できない。上の行からつながってないか。');
    }
    HLib.assert(t.type === TokenType.TOKEN_CONST, `${__filename}:91`);
    this.mPos += 1;

    // 名前
    t = tokens[this.mPos];
    if (t.type !== TokenType.TOKEN_NAME) {
      throw new Error(`E102: 行${t.line}: 定数'の次は定数名。'${t.string}'は定数名と解釈できない。`);
    }
    const constName:string = t.string || '';
    this.mPos += 1;

    // →
    t = tokens[this.mPos];
    if (t.type !== TokenType.TOKEN_SUBSTITUTION) {
      throw new Error(`E103: 行${t.line}: 定数 [名前]、と来たら次は'→'のはずだが「${t.string}'」がある。`);
    }
    this.mPos += 1;

    // Expression
    const expression = this.parseExpression();
    if (expression === null) {
      return false;
    }

    if (expression.type !== NodeType.NODE_NUMBER) {  // 数字に解決されていなければ駄目。
      throw new Error(`E104: 行${t.line}: 定数の右辺の計算に失敗した。メモリや名前つきメモリ、部分プログラム参照などが入っていないか？`);
    }
    const constValue = expression.number;
    // this.mPos += 1; // C#版は += 1していないのでコメント化した

    // 文末
    t = tokens[this.mPos];
    if (t.type !== TokenType.TOKEN_STATEMENT_END) {
      throw new Error(`行${t.line}: 定数作成の後に'${t.string}'がある。改行してくれ。\n`);
    }
    this.mPos += 1;

    // マップに登録
    if (!skipFlag) {
      if (constName in this.mConstMap) { // もうある
        throw new Error(`E105: 行${t.line}: 定数「${constName}」はすでに同じ名前の定数がある。`);
      }
      this.mConstMap[constName] = constValue;
    }

    return true;
  }

  // FunctionDefinition : name ( name? [ , name ]* ) とは [{ statement* }]
  // FunctionDefinition : def name ( name? [ , name ]* ) [{ statement* }]
  public parseFunctionDefinition(): Node|null {
    // defスキップ
    const tokens:Array<Token> = this.mTokens;
    let t:Token = tokens[this.mPos];
    let defFound:boolean = false;

    if (t.type === TokenType.TOKEN_DEF_PRE) {
      this.mPos += 1;
      defFound = true;
      t = tokens[this.mPos];
    }

    // ノード準備
    const node:Node = new Node(NodeType.NODE_FUNCTION_DEFINITION, t);
    this.mPos += 1;

    // (
    t = tokens[this.mPos];
    if (t.type !== TokenType.TOKEN_LEFT_BRACKET) {
      throw new Error(`E110: 行${t.line}: 入力リスト開始の「(」があるはずだが、「${t.string}」がある。`);
    }
    this.mPos += 1;

    // 次がnameなら引数が一つはある
    let lastChild:Node|null = null;
    t = tokens[this.mPos];
    if (t.type === TokenType.TOKEN_NAME) {
      let arg:Node|null = this.parseVariable();
      if (arg === null) {
        return null;
      }

      node.child = arg;
      lastChild = arg;

      // 第二引数以降を処理
      while (tokens[this.mPos].type === TokenType.TOKEN_COMMA) {
        this.mPos += 1;
        t = tokens[this.mPos];
        if (t.type !== TokenType.TOKEN_NAME) { // 名前でないのはエラー
          throw new Error(`E111: 行${t.line}: 入力リスト中に「,」がある以上、まだ入力があるはずだが、「${t.string}」がある。`);
        }

        arg = this.parseVariable();
        if (arg === null) {
          return null;
        }

        // 引数名が定数なのは許さない
        t = tokens[this.mPos];
        if (arg.type === NodeType.NODE_NUMBER) { // 定数は構文解析中に解決されてNUMBERになってしまう。
          throw new Error(`E112: 行${t.line}: 定数と同じ名前は入力につけられない。`);
        }
        lastChild.brother = arg;
        lastChild = arg;
      }
    }

    // )
    t = tokens[this.mPos];
    if (t.type !== TokenType.TOKEN_RIGHT_BRACKET) {
      throw new Error(`E113: 行${t.line}: 入力リスト終了の「)」があるはずだが、「${t.string}」がある。`);
    }
    this.mPos += 1;

    // とは
    t = tokens[this.mPos];
    if (t.type === TokenType.TOKEN_DEF_POST) {
      if (defFound) {
        throw new Error(`E114: 行${t.line}: 「def」と「とは」が両方ある。片方にしてほしい。`);
      }
      defFound = true;
      this.mPos += 1;
    }

    // 関数定義の中身
    t = tokens[this.mPos];
    if (t.type === TokenType.TOKEN_BLOCK_BEGIN) {
      this.mPos += 1;
      for (t = tokens[this.mPos]; ; t = tokens[this.mPos]) {
        let child:Node|null = null;
        if (t.type === TokenType.TOKEN_BLOCK_END) { // 終わり
          this.mPos += 1;
          break;
        } else if (t.type === TokenType.TOKEN_CONST) { // 定数は関数定義の中では許しませんよ
          throw new Error(`E115: 行${t.line}: 部分プログラム内で定数は作れない。`);
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
    } else if (t.type === TokenType.TOKEN_STATEMENT_END) { // いきなり空
      this.mPos += 1;
    } else { // エラー
      throw new Error(`E116: 行${t.line}: 部分プログラムの最初の行の行末に「${t.string}」が続いている。改行しよう。`);
    }

    return node;
  }

  // Statement : ( while | if | return | funcDef | func | set )
  public parseStatement(): Node|null {
    const statementType:StatementType = this.getStatementType();
    let node:Node|null = null;
    let t:Token|null = null;

    if (statementType === StatementType.STATEMENT_WHILE_OR_IF) {
      node = this.parseWhileOrIfStatement();
    } else if (statementType === StatementType.STATEMENT_DEF) { // これはエラー
      t = this.mTokens[this.mPos];
      throw new Error(`E120: 行${t.line}: 部分プログラム内で部分プログラムは作れない。`);
    } else if (statementType === StatementType.STATEMENT_CONST) { // これはありえない
      throw new Error('BUG parseStatement CONST');
    } else if (statementType === StatementType.STATEMENT_FUNCTION) { // 関数呼び出し文
      node = this.parseFunction();
      if (node === null) {
        return null;
      }

      t = this.mTokens[this.mPos];
      if (t.type !== TokenType.TOKEN_STATEMENT_END) { // 文終わってないぞ
        if (t.type === TokenType.TOKEN_BLOCK_BEGIN) {
          throw new Error(`E121: 行${t.line}: 部分プログラムを作ろうとした？それは部分プログラムの外で「def」なり「とは」なりを使ってね。それとも、次の行の字下げが多すぎただけ？`);
        } else {
          throw new Error(`E122: 行${t.line}: 部分プログラム参照の後ろに、「${t.string}」がある。改行したら？`);
        }
      }

      this.mPos += 1;
    } else if (statementType === StatementType.STATEMENT_SUBSTITUTION) { // 代入
      node = this.parseSubstitutionStatement();
    } else if (statementType === StatementType.STATEMENT_UNKNOWN) { // 不明。エラー文字列は作ってあるので上へ
      return null;
    } else {
      throw new Error('BUG parseStatement');
    }

    return node;
  }

  // 文タイプを判定
  // DEF, FUNC, WHILE_OR_IF, CONST, SET, nullのどれかが返る。メンバは変更しない。
  public getStatementType(): StatementType {
    const pos:number = this.mPos; // コピーを作ってこっちをいじる。オブジェクトの状態は変えない。
    const tokens:Array<Token> = this.mTokens;
    let t:Token = tokens[pos];

    // 文頭でわかるケースを判別
    if (t.type === TokenType.TOKEN_BLOCK_BEGIN) {
      throw new Error(`E130: 行${t.line}: 字下げを間違っているはず。上の行より多くないか。`);
    } else if ((t.type === TokenType.TOKEN_WHILE_PRE) || (t.type === TokenType.TOKEN_IF_PRE)) {
      return StatementType.STATEMENT_WHILE_OR_IF;
    } else if (t.type === TokenType.TOKEN_DEF_PRE) {
      return StatementType.STATEMENT_DEF;
    } else if (t.type === TokenType.TOKEN_CONST) {
      return StatementType.STATEMENT_CONST;
    }

    // 文末までスキャン
    let endPos:number = pos;
    while ((tokens[endPos].type !== TokenType.TOKEN_STATEMENT_END) && (tokens[endPos].type !== TokenType.TOKEN_BLOCK_BEGIN)) {
      endPos += 1;
    }

    // 後置キーワード判定
    if (endPos > pos) {
      t = tokens[endPos - 1];
      if ((t.type === TokenType.TOKEN_WHILE_POST) || (t.type === TokenType.TOKEN_IF_POST)) {
        return StatementType.STATEMENT_WHILE_OR_IF;
      } else if (t.type === TokenType.TOKEN_DEF_POST) {
        return StatementType.STATEMENT_DEF;
      }
    }

    // 代入記号を探す
    for (let i = pos; i < endPos; i += 1) {
      if (tokens[i].type === TokenType.TOKEN_SUBSTITUTION) {
        return StatementType.STATEMENT_SUBSTITUTION;
      }
    }

    // 残るは関数コール文?
    if ((tokens[pos].type === TokenType.TOKEN_NAME) && (tokens[pos + 1].type === TokenType.TOKEN_LEFT_BRACKET)) {
      return StatementType.STATEMENT_FUNCTION;
    }

    // 解釈不能。ありがちなのは「なかぎり」「なら」の左に空白がないケース
    throw new Error(`E131: 行${t.line}: 解釈できない。注釈は// じゃなくて#だよ？あと、「なかぎり」「なら」の前には空白ある？それと、メモリセットは=じゃなくて→だよ？`);
    // TODO: どんなエラーか推測してやれ
    // TODO: 後ろにゴミがあるくらいなら無視して進む手もあるが、要検討
  }

  // Set: [out | memory | name | array] → expression ;
  public parseSubstitutionStatement(): Node|null{
    //
    const tokens:Array<Token> = this.mTokens;
    let t:Token = tokens[this.mPos];
    if ((t.type !== TokenType.TOKEN_NAME) && (t.type !== TokenType.TOKEN_OUT)) {
      throw new Error(`E140: 行${t.line}: 「→」があるのでメモリセット行だと思うが、それなら「memory」とか「out」とか、名前付きメモリの名前とか、そういうものから始まるはず。`);
    }
    const node:Node = new Node(NodeType.NODE_SUBSTITUTION_STATEMENT, t);

    // 左辺
    let left:Node|null = null;
    if (t.type === TokenType.TOKEN_OUT) {
      left = new Node(NodeType.NODE_OUT, t);
      this.mPos += 1;
    } else if (tokens[this.mPos + 1].type === TokenType.TOKEN_INDEX_BEGIN) {
        // 配列だ
        left = this.parseArrayElement();
    } else { // 変数
      left = this.parseVariable();
      if (left.type === NodeType.NODE_NUMBER) {
        // 定数じゃん！
        throw new Error(`E141: 行${t.line}: ${t.string}は定数で、セットできない。`);
      }
    }
    if (left === null) {
      return null;
    }
    node.child = left;

    // →
    t = tokens[this.mPos];
    if (t.type !== TokenType.TOKEN_SUBSTITUTION) {
      throw new Error(`E142: 行${t.line}: メモリセット行だと思ったのだが、あるべき場所に「→」がない。`);
    }
    this.mPos += 1;

    // 右辺は式
    const right:Node|null = this.parseExpression();
    if (right === null) {
      return null;
    }
    left.brother = right;

    // ;
    t = tokens[this.mPos];
    if (t.type !== TokenType.TOKEN_STATEMENT_END) {
      throw new Error(`E143: 行${t.line}: 次の行の字下げが多すぎるんじゃなかろうか。`);
    }
    this.mPos += 1;

    return node;
  }

  // while|if expression [ { } ]
  // while|if expression;
  // expression while_post|if_post [ { } ]
  // expression while_post|if_post ;
  public parseWhileOrIfStatement(): Node|null {
    const tokens:Array<Token> = this.mTokens;
    let t:Token = tokens[this.mPos];
    const node:Node = new Node(NodeType.NODE_UNKNOWN, t);

    // 前置ならすぐ決まる
    if (t.type === TokenType.TOKEN_WHILE_PRE) {
      node.type = NodeType.NODE_WHILE_STATEMENT;
      this.mPos += 1;
    } else if (t.type === TokenType.TOKEN_IF_PRE) {
      node.type = NodeType.NODE_IF_STATEMENT;
      this.mPos += 1;
    }
    // 条件式
    const exp:Node|null = this.parseExpression();
    if (exp === null) {
      return null;
    }
    node.child = exp;

    // まだどっちか確定してない場合、ここにキーワードがあるはず
    t = tokens[this.mPos];
    if (node.type === NodeType.NODE_UNKNOWN) {
      if (t.type === TokenType.TOKEN_WHILE_POST) {
        node.type = NodeType.NODE_WHILE_STATEMENT;
      } else if (t.type === TokenType.TOKEN_IF_POST) {
        node.type = NodeType.NODE_IF_STATEMENT;
      }
      this.mPos += 1;
    }

    // ブロックがあるなら処理
    t = tokens[this.mPos];
    if (t.type === TokenType.TOKEN_BLOCK_BEGIN) {
      this.mPos += 1;
      let lastChild:Node = exp;
      for (;;) {
        let child:Node|null = null;
        t = tokens[this.mPos];
        if (t.type === TokenType.TOKEN_BLOCK_END) {
          this.mPos += 1;
          break;
        } else if (t.type === TokenType.TOKEN_CONST) {
          throw new Error(`E150: 行${t.line}: 繰り返しや条件実行の中で定数は作れない。`);
        } else {
          child = this.parseStatement();
        }

        if (child === null) {
          return null;
        }
        lastChild.brother = child;
        lastChild = child;
      }
    } else if (t.type === TokenType.TOKEN_STATEMENT_END) { // 中身なしwhile/if
      this.mPos += 1;
    } else {
      throw new Error(`E151: 行${t.line}: 条件行は条件の終わりで改行しよう。「${t.string}」が続いている。`);
    }

    return node;
  }

  // Array : name [ expression ]
  public parseArrayElement(): Node|null {
    const node:Node|null = this.parseVariable();
    if (node === null) {
      return null;
    }
    node.type = NodeType.NODE_ARRAY_ELEMENT;

    // [
    HLib.assert(this.mTokens[this.mPos].type === TokenType.TOKEN_INDEX_BEGIN, `${__filename}:471`); // getTermTypeで判定済み
    this.mPos += 1;

    // expression
    const expression:Node|null = this.parseExpression();
    if (expression === null) {
      return null;
    }
    node.child = expression;

    // expressionが数値であれば、アドレス計算はここでやる
    if (expression.type === NodeType.NODE_NUMBER) {
      node.number += expression.number;
      node.child = null; // 子のExpressionを破棄
    }

    // ]
    if (this.mTokens[this.mPos].type !== TokenType.TOKEN_INDEX_END) {
      const t:Token = this.mTokens[this.mPos];
      throw new Error(`E160: 行${t.line}: 名前つきメモリ[番号]の']'の代わりに'${t.string}'がある。\n`);
    }
    this.mPos += 1;

    return node;
  }

  // Variable : name
  public parseVariable(): Node {
    const t:Token = this.mTokens[this.mPos];
    HLib.assert(t.type === TokenType.TOKEN_NAME, `${__filename}:501`);
    let node:Node;

    // 定数？変数？
    const c = this.mConstMap[t.string];
    if (typeof c !== 'undefined') {
      node = new Node(NodeType.NODE_NUMBER);
      node.number = c;
    } else {
      node = new Node(NodeType.NODE_VARIABLE, t);
    }
    this.mPos += 1;

    return node;
  }

  // Out : out
  public parseOut(): Node {
    const t:Token = this.mTokens[this.mPos];
    HLib.assert(t.type === TokenType.TOKEN_OUT, `${__filename}:521`);
    const node:Node = new Node(NodeType.NODE_OUT, t);
    this.mPos += 1;
    return node;
  }

  // Expression : expression +|-|*|/|<|>|≤|≥|≠|= expression
  // 左結合の木になる。途中で回転が行われることがある。
  // E170
  public parseExpression(): Node|null {
    // ボトムアップ構築して、左結合の木を作る。
    // 最初の左ノードを生成
    let left:Node|null = this.parseTerm();
    if (left === null) {
      return null;
    }

    // 演算子がつながる限りループ
    for (let t:Token = this.mTokens[this.mPos]; t.type === TokenType.TOKEN_OPERATOR; t = this.mTokens[this.mPos]) {
      // ノードを生成
      // 演算子を設定
      const node:Node = Node.createExpression(t, t.operator || '', null, null);
      this.mPos += 1;

      // 連続して演算子なら親切にエラーを吐いてやる。
      t = this.mTokens[this.mPos];
      if ((t.type === TokenType.TOKEN_OPERATOR) && (t.operator !== '-')) { // -以外の演算子ならエラー
        throw new Error(`E170: 行${t.line}: 演算子が連続している。==や++や--はない。=>や=<は>=や<=の間違いだろう。`);
      }

      // 右の子を生成
      let right:Node|null = this.parseTerm();
      if (right === null) {
        return null;
      }

      // GT,GEなら左右交換して不等号の向きを逆に
      if ((node.operator === '>') || (node.operator === '≥')) {
        const tmp = left;
        left  = right;
        right = tmp;
        if (node.operator === '>') {
          node.operator = '<';
        } else {
          node.operator = '≤';
        }
      }

      // 最適化。左右ノードが両方数値なら計算をここでやる
      // 最適化。定数の使い勝手向上のために必須 TODO:a + 2 + 3がa+5にならないよねこれ
      let preComputed = null;
      if ((left.type === NodeType.NODE_NUMBER) && (right.type === NodeType.NODE_NUMBER)) {
        const a:number = left.number;
        const b:number = right.number;
        if (node.operator === '+') {
          preComputed = a + b;
        } else if (node.operator === '-') {
          preComputed = a - b;
        } else if (node.operator === '*') {
          preComputed = a * b;
        } else if (node.operator === '/') {
          if (b === 0) {
            throw new Error(`E171: 行${t.line}: 0で割り算している。`);
          }
          preComputed = Math.floor(a / b); // 整数化必須
        } else if (node.operator === '<') {
          preComputed = (a < b) ? 1 : 0;
        } else if (node.operator === '≤') {
          preComputed = (a <= b) ? 1 : 0;
        } else if (node.operator === '=') {
          preComputed = (a === b) ? 1 : 0;
        } else if (node.operator === '≠') {
          preComputed = (a !== b) ? 1 : 0;
        } else {
          throw new Error('BUG parseExpression #1'); // >と≥は上で置換されてなくなっている
        }
      }

      if (preComputed !== null) { // 事前計算でノードをマージ
        node.type   = NodeType.NODE_NUMBER;
        node.number = preComputed;
        left    = null;
        right     = null;
      } else {
        node.child   = left;
        left.brother = right;
      }

      // 現ノードを左の子として継続
      left = node;
    }

    return left;
  }

  public getTermType(): TermType {
    let t:Token  = this.mTokens[this.mPos];
    let r:TermType = TermType.TERM_UNKNOWN;

    if (t.type === TokenType.TOKEN_LEFT_BRACKET) {
      r = TermType.TERM_EXPRESSION;
    } else if (t.type === TokenType.TOKEN_NUMBER) {
      r = TermType.TERM_NUMBER;
    } else if (t.type === TokenType.TOKEN_NAME) {
      t = this.mTokens[this.mPos + 1];
      if (t.type === TokenType.TOKEN_LEFT_BRACKET) {
        r = TermType.TERM_FUNCTION;
      } else if (t.type === TokenType.TOKEN_INDEX_BEGIN) {
        r = TermType.TERM_ARRAY_ELEMENT;
      } else {
        r = TermType.TERM_VARIABLE;
      }
    } else if (t.type === TokenType.TOKEN_OUT) {
      r = TermType.TERM_OUT;
    }

    return r;
  }

  // Term : [-] function|variable|out|array|number|(expression)
  // E180
  public parseTerm() {
    let t:Token = this.mTokens[this.mPos];
    let minus:boolean = false;

    if (t.operator === '-') {
      minus = true;
      this.mPos += 1;
    }

    t = this.mTokens[this.mPos];
    const termType:TermType = this.getTermType();
    let node:Node|null = null;

    if (termType === TermType.TERM_EXPRESSION) {
      HLib.assert(t.type === TokenType.TOKEN_LEFT_BRACKET, `${__filename}:651`);
      this.mPos += 1;
      node = this.parseExpression();
      t = this.mTokens[this.mPos];
      if (t.type !== TokenType.TOKEN_RIGHT_BRACKET) {
        throw new Error(`E180: 行${t.line}: ()で囲まれた式がありそうなのだが、終わりの')'の代わりに「${t.string}」がある。`);
      }
      this.mPos += 1;
    } else if (termType === TermType.TERM_NUMBER) {
      node = Node.createNumber(t, t.number, null, null);
      this.mPos += 1;
    } else if (termType === TermType.TERM_FUNCTION) {
      node = this.parseFunction();
    } else if (termType === TermType.TERM_ARRAY_ELEMENT) {
      node = this.parseArrayElement();
    } else if (termType === TermType.TERM_VARIABLE) {
      node = this.parseVariable();
    } else if (termType === TermType.TERM_OUT) {
      node = this.parseOut();
    } else {
      throw new Error(`E181: 行${t.line}: ここには、()で囲まれた式、memory[]、数、名前つきメモリ、部分プログラム参照、のどれかがあるはずなのだが、代わりに「${t.string}」がある。`);
    }

    if ((node !== null) && minus) {
      if (node.type === NodeType.NODE_NUMBER) { // この場で反転
        node.number = -(node.number);
      } else { // 反転は後に伝える
        node.negation = true;
      }
    }
    return node;
  }

  // Function : name ( [ expression [ , expression ]* ] )
  // E190
  public parseFunction(): Node|null {
    let t:Token = this.mTokens[this.mPos];
    HLib.assert(t.type === TokenType.TOKEN_NAME, `${__filename}:688`);
    const node:Node = new Node(NodeType.NODE_FUNCTION, t);
    this.mPos += 1;

    // '(''
    t = this.mTokens[this.mPos];
    HLib.assert(t.type === TokenType.TOKEN_LEFT_BRACKET, `${__filename}:694`);
    this.mPos += 1;

    // 引数ありか、なしか
    t = this.mTokens[this.mPos];
    if (t.type !== TokenType.TOKEN_RIGHT_BRACKET) { // 括弧閉じないので引数あり
      let exp:Node|null = this.parseExpression();
      if (exp === null) {
        return null;
      }
      node.child = exp;

      // 2個目以降はループで取る
      let lastChild:Node = exp;
      for (;;) {
        t = this.mTokens[this.mPos];
        if (t.type !== TokenType.TOKEN_COMMA) {
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

    // ')'
    if (t.type !== TokenType.TOKEN_RIGHT_BRACKET) {
      throw new Error(`E190: 行${t.line}: 部分プログラムの入力が')'で終わるはずだが、「${t.string}」がある。`);
    }
    this.mPos += 1;

    return node;
  }
}
