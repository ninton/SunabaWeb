/* eslint
  no-unused-vars: 0,
  no-console: 0
 */
import HLib from './HLib';
import FunctionInfo from './FunctionInfo';
import TokenType from './TokenType';
import { NodeType } from './NodeType';
import Node from './Node';
import AsmCommand from './AsmCommand';

class Variable {
  private mDefined  : boolean;
  private mInitialized: boolean;
  private mOffset   : number;

  constructor() {
    this.mDefined   = false;
    this.mInitialized = false;
    this.mOffset    = 0;
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
  public mParent  :Block|null;
  public mBaseOffset:number;
  public mFrameSize :number;
  private mVariables:{[key:string]: Variable;};
  private stream:any;

  constructor(baseOffset:number) {
    this.mParent   = null;
    this.mBaseOffset = baseOffset;
    this.mFrameSize  = 0;
    this.stream = (s:string) => {
      console.log(s);
    };
    this.mVariables = {};
  }

  public beginError(node:any) {
    const { token } = node;
    HLib.assert(token, `${__filename}:59`);

    let s = '';
    if (token.line !== 0) {
      s = `(${token.line})`;
    } else {
      s = ' ';
    }
    this.stream(s);
  }

  public addVariable(name:string, isArgument:boolean = false): boolean {
    if (name in this.mVariables) {
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
      if (statement.type === NodeType.NODE_SUBSTITUTION_STATEMENT) {
        const left = statement.child;
        HLib.assert(left, `${__filename}:92`);

        if (left.type === NodeType.NODE_VARIABLE) { // 変数への代入文のみ扱う。配列要素や定数は無視。
          HLib.assert(left.token, `${__filename}:95`);
          const vName = left.token.string;

          // ここより上にこの変数があるか調べる。
          const v = this.findVariable(vName);
          if (!v) {
            // ない。新しい変数を生成
            if (!this.addVariable(vName)) {
              // ありえん
              HLib.assert(false, `${__filename}:104`);
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
    }

    if (this.mParent) {
      // 親がいる
      return this.mParent.findVariable(name);
    }

    return null;
  }
}

class OffsetParams {
  fpRelative: boolean = false;
  staticOffset: number = 0;

  public setFpRelative(fpRelative:boolean): void {
    this.fpRelative = fpRelative;
  }

  public setStaticOffset(staticOffset:number): void {
    this.staticOffset = staticOffset;
  }
}

export default class FunctionGenerator {
  cmds:Array<AsmCommand>;

  mRootBlock  :Block;
  mCurrentBlock :Block;
  mLabelId    :number;
  mName     :string;
  mInfo     :FunctionInfo;
  mFunctionMap  :any;
  mOutputExist  :boolean;

  constructor(functionMap:{[name:string]: FunctionInfo}) {
    this.cmds      = [];
    this.mRootBlock  = new Block(0);  // dummy
    this.mCurrentBlock = new Block(0);  // dummy
    this.mLabelId    = 0;
    this.mName     = '';
    this.mInfo     = new FunctionInfo();  // dummy
    this.mFunctionMap  = functionMap;
    this.mOutputExist  = false;
  }

  public addCommand(name:string, imm:number|string = 0, comment:string = '') {
    const cmd:AsmCommand = new AsmCommand('', name, imm, comment);
    this.cmds.push(cmd);
  }

  public addLabel(label:string, comment:string = '') {
    const cmd:AsmCommand = new AsmCommand(label, '', 0, comment);
    this.cmds.push(cmd);
  }

  public mergeCommands(cmds:Array<AsmCommand>) {
    cmds.forEach((item:any) => {
      this.cmds.push(item);
    });
  }

  public getCommands() {
    return this.cmds;
  }

  // E200
  public process(node:Node, funcName:string): boolean {
    this.mName = funcName;
    this.mInfo = this.mFunctionMap[this.mName];

    // 後でエラー出力に使うのでとっておく。
    const headNode:Node = node;

    // FP相対オフセットを計算
    const argCount:number = this.mInfo.argCount();

    // ルートブロック生成(TODO:このnew本来不要。コンストラクタでスタックに持つようにできるはず)
    this.mRootBlock = new Block(-argCount - 3);   // 戻り値、引数*N、FP、CPと詰めたところが今のFP。戻り値の位置は-argcount-3
    this.mCurrentBlock = this.mRootBlock;

    // 戻り値変数を変数マップに登録
    this.mCurrentBlock.addVariable('!ret');

    // 引数処理
    // みつかった順にアドレスを割り振りながらマップに登録。
    // 呼ぶ時は前からプッシュし、このあとFP,PCをプッシュしたところがSPになる。
    let { child } = node;
    while (child) { // このループを抜けた段階で最初のchildは最初のstatementになっている
      if (child.type !== NodeType.NODE_VARIABLE) {
        break;
      }

      if (child.token === null) {
        throw new Error(`child.token === null, ${__filename}:195`);
      }
      const variableName = child.token.string;

      if (!this.mCurrentBlock.addVariable(variableName, true)) {
        this.beginError(node);
        throw new Error(`E201: 部分プログラム'${this.mName}'の入力'${variableName}はもうすでに現れた。二個同じ名前があるのはダメ。`);
      }
      child = child.brother;
    }

    // FP、CPを変数マップに登録(これで処理が簡単になる)
    this.mCurrentBlock.addVariable('!fp');
    this.mCurrentBlock.addVariable('!cp');

    // ルートブロックのローカル変数サイズを調べる
    this.mRootBlock.collectVariables(child);

    // 関数開始コメント
    this.addCommand('', 0, `#部分プログラム"${this.mName}"の開始\n`);
    // 関数開始ラベル
    // 160413: add等のアセンブラ命令と同名の関数があった時にラベルを命令と間違えて誤作動する問題の緊急回避
    this.addLabel(`func_${this.mName}`);

    // ローカル変数を確保
    // 戻り値、FP、CP、引数はここで問題にするローカル変数ではない。呼出側でプッシュしているからだ。
    const netFrameSize:number = this.mCurrentBlock.mFrameSize - 3 - argCount;
    if (netFrameSize > 0) {
      // -1は戻り値を入れてしまった分
      this.addCommand('pop', -netFrameSize, '#ローカル変数確保');
    }

    // 中身を処理
    while (child) {
      if (!this.generateStatement(child)) {
        return false;
      }
      child = child.brother;
    }

    // 関数終了点ラベル。上のループの中でreturnがあればここに飛んでくる。
    // 	this.addLabel(`${this.mName}_end:`);

    // ret生成(ローカル変数)
    this.addCommand('ret', netFrameSize, `#部分プログラム"${this.mName}の終了`);

    // 出力の整合性チェック。
    // ifの中などで出力してるのに、ブロック外に出力がないケースを検出
    if (this.mInfo.hasOutputValue() !== this.mOutputExist) {
      HLib.assert(this.mOutputExist, `${__filename}:245`); // outputExistがfalseで、hasOutputValue()がtrueはありえない
      if (headNode.token) {
        // 普通の関数ノード
        this.beginError(headNode);
        throw new Error(`E202: 部分プログラム'${this.mName}'は出力したりしなかったりする。条件実行や繰り返しの中だけで出力していないか？`);
      } else {
        // プログラムノード
        HLib.assert(headNode.child !== null, `${__filename}:252`);
        this.beginError(headNode.child);
        throw new Error('E203: このプログラムは出力したりしなかったりする。条件実行や繰り返しの中だけで出力していないか？');
      }
    }

    return true;
  }

  public generateStatement(node:Node): boolean {
    // ブロック生成命令は別扱い
    if ((node.type === NodeType.NODE_WHILE_STATEMENT) || (node.type === NodeType.NODE_IF_STATEMENT)) {
      // 新ブロック生成
      const newBlock:Block = new Block(this.mCurrentBlock.mBaseOffset + this.mCurrentBlock.mFrameSize);
      newBlock.mParent = this.mCurrentBlock; // 親差し込み
      newBlock.collectVariables(node.child); // フレーム生成
      this.mCurrentBlock = newBlock;

      // ローカル変数を確保
      if (this.mCurrentBlock.mFrameSize > 0) {
        this.addCommand('pop', -(this.mCurrentBlock.mFrameSize), '#ブロックローカル変数確保');
      }

      if (node.type === NodeType.NODE_WHILE_STATEMENT) {
        if (!this.generateWhile(node)) {
          return false;
        }
      } else if (node.type === NodeType.NODE_IF_STATEMENT) {
        if (!this.generateIf(node)) {
          return false;
        }
      }

      // ローカル変数ポップ
      if (this.mCurrentBlock.mFrameSize > 0) {
        this.addCommand('pop', this.mCurrentBlock.mFrameSize, '#ブロックローカル変数破棄');
      }
      if (this.mCurrentBlock.mParent === null) {
        throw new Error(`BUG: this.mCurrentBlock.mParent === null ${__filename}:#298`);
      }
      this.mCurrentBlock = this.mCurrentBlock.mParent; // スタック戻し
    } else if (node.type === NodeType.NODE_SUBSTITUTION_STATEMENT) {
      if (!this.generateSubstitution(node)) {
        return false;
      }
    } else if (node.type === NodeType.NODE_FUNCTION) {
      // 関数だけ呼んで結果を代入しない文
      if (!this.generateFunctionStatement(node)) {
        return false;
      }
    } else if (node.type === NodeType.NODE_FUNCTION_DEFINITION) {
      // 関数定義はもう処理済みなので無視。
      // スルー
    } else {
      HLib.assert(false, `${__filename}:305 node.type:${node.type}`);
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
  public generateWhile(node:Node): boolean {
    HLib.assert(node.type === NodeType.NODE_WHILE_STATEMENT, `${__filename}:327`);
    if (node.child === null) {
      throw new Error(`BUG node.child === null ${node.type} ${__filename}:339`);
    }

    // 開始ラベル
    const whileBegin:string = `${this.mName}_whileBegin${this.mLabelId}`;
    const whileEnd  :string = `${this.mName}_whileEnd${this.mLabelId}`;
    this.mLabelId += 1;

    this.addLabel(whileBegin);

    // Expression処理
    const { child } = node;
    if (!this.generateExpression(child)) {
      // 最初の子はExpression
      return false;
    }

    // いくつかコード生成
    this.addCommand('bz', whileEnd);

    // 内部の文を処理
    let bro:Node|null = child.brother;
    while (bro) {
      if (!this.generateStatement(bro)) {
        return false;
      }
      bro = bro.brother;
    }

    // ループの最初へ飛ぶジャンプを生成
    this.addCommand('j', whileBegin, '#ループ先頭へ無条件ジャンプ');

    // ループ終了ラベルを生成
    this.addLabel(whileEnd);

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
  public generateIf(node:Node): boolean {
    HLib.assert(node.type === NodeType.NODE_IF_STATEMENT, `${__filename}:375`);
    if (node.child === null) {
      throw new Error(`BUG node.child === null ${node.type} ${__filename}:389`);
    }

    // Expression処理
    let { child } = node;
    if (!this.generateExpression(child)) {
      // 最初の子はExpression
      return false;
    }

    // コード生成
    const label_ifEnd = `${this.mName}_ifEnd${this.mLabelId}`;
    this.mLabelId += 1;

    this.addCommand('bz', label_ifEnd);

    // 内部の文を処理
    while (child.brother) {
      child = child.brother;
      if (!this.generateStatement(child)) {
        return false;
      }
    }

    // ラベル生成
    this.addLabel(label_ifEnd);

    return true;
  }

  public generateFunctionStatement(node:Node): boolean {
    // まず関数呼び出し
    if (!this.generateFunction(node, true)) {
      return false;
    }

    // 関数の戻り値がプッシュされているので捨てます。
    // this.addCommandg('pop', 1, '#戻り値を使わないので、破棄');

    return true;
  }

  // E210
  public generateFunction(node:Node, isStatement:boolean): boolean {
    HLib.assert(node.type === NodeType.NODE_FUNCTION, `${__filename}:420`);
    if (node.token === null) {
      throw new Error(`BUG node.child === null ${node.type} ${__filename}:435`);
    }

    // まず、その関数が存在していて、定義済みかを調べる。
    const funcName:string = node.token.string;
    if (!(funcName in this.mFunctionMap)) {
      this.beginError(node);
      throw new Error(`E210: 部分プログラム'${funcName}'なんて知らない。`);
    }

    const func:FunctionInfo = this.mFunctionMap[funcName];
    let popCount:number = 0; // 後で引数/戻り値分ポップ
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
      throw new Error(`E211: 部分プログラム'${funcName}'は、'出力'か'out'という名前付きメモリがないので、出力は使えない。ifやwhileの中にあってもダメ。`);
    }

    // 引数の数をチェック
    let arg:Node|null = node.child;
    let argCount:number = 0;
    while (arg) {
      argCount += 1;
      arg = arg.brother;
    }

    popCount += argCount; // 引数分追加
    if (argCount !== func.argCount()) {
      this.beginError(node);
      throw new Error(`E212: 部分プログラム'${funcName}'は、入力を${func.argCount()}個受け取るのに、ここには$$argCount}個ある。間違い。`);
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
    const label:string = `func_${funcName}`;
    this.addCommand('call', label);

    // 返ってきたら、引数/戻り値をポップ
    if (popCount > 0) {
      this.addCommand('pop', popCount, '#引数/戻り値ポップ');
    }

    return true;
  }

  /*
  LeftValue
  Expression
  st
  */
  // E220
  public generateSubstitution(node:Node): boolean {
    HLib.assert(node.type === NodeType.NODE_SUBSTITUTION_STATEMENT, `${__filename}:489`);

    // 左辺値のアドレスを求める。最初の子が左辺値
    if (node.child === null) {
      HLib.assert(false, `${__filename}:496`);
      return false;
    }

    const { child } = node;

    // 変数の定義状態を参照
    let v:Variable|null = null;

    if ((child.type === NodeType.NODE_OUT) || child.token) { // 変数があるなら
      let name:string = child.token!.string || '';
      if (child.type === NodeType.NODE_OUT) {
        name = '!ret';
      }
      v = this.mCurrentBlock.findVariable(name);
      if (!v) {
        // 配列アクセス時でタイプミスすると変数が存在しないケースがある
        this.beginError(child);
        throw new Error(`E220:名前付きメモリか定数'${name}'は存在しないか、まだ作られていない。`);
      } else if (!(v.isDefined())) { // 未定義ならここで定義
        v.define();
      }
    }

    const params = new OffsetParams();
    if (!this.pushDynamicOffset(params, child)) {
      return false;
    }

    // 右辺処理
    if (child.brother === null) {
      HLib.assert(false, `${__filename}:529`);
      return false;
    }

    if (!this.generateExpression(child.brother)) {
      return false;
    }

    let cmd:string;
    if (params.fpRelative) {
      cmd = 'fst';
    } else {
      cmd = 'st';
    }

    const name:string = node.token!.string || '';
    this.addCommand(cmd, params.staticOffset, `#"${name}"へストア`);

    // 左辺値は初期化されたのでフラグをセット。すでにセットされていても気にしない。
    if (v) {
      v.initialize();
    }

    return true;
  }

  // 第一項、第二項、第二項オペレータ、第三項、第三項オペレータ...という具合に実行
  public generateExpression(node:Node): boolean {
    // 解決されて単項になっていれば、そのままgenerateTermに丸投げ。ただし単項マイナスはここで処理。
    let ret:boolean = false;
    if (node.type !== NodeType.NODE_EXPRESSION) {
      ret = this.generateTerm(node);
    } else {
      if (node.negation) {
        this.addCommand('i', 0, '#()に対する単項マイナス用');
      }

      // 項は必ず二つある。
      if (node.child === null) {
        HLib.assert(false, `${__filename}:556`);
        return false;
      }

      if (node.child.brother === null) {
        HLib.assert(false, `${__filename}:557`);
        return false;
      }

      if (!this.generateTerm(node.child)) {
        return false;
      }

      if (!this.generateTerm(node.child.brother)) {
        return false;
      }

      // 演算子を適用
      const op = this.getOpFromOperator(node.operator);
      this.addCommand(op);

      // 単項マイナスがある場合、ここで減算
      if (node.negation) {
        this.addCommand('sub', '', '#()に対する単項マイナス用');
      }
      ret = true;
    }

    return ret;
  }

  public getOpFromOperator(operator:string): string {
    const table:{[key:string]: string;} = {
      '+': 'add',
      '-': 'sub',
      '*': 'mul',
      '/': 'div',
      '<': 'lt',
      '≤': 'le',
      '=': 'eq',
      '≠': 'ne',
    };

    if (!(operator in table)) {
      // これはParserのバグ。とりわけ、LE、GEは前の段階でGT,LTに変換されていることに注意
      HLib.assert(false, `${__filename}:595 unkown operator: ${operator}`);
    }

    return table[operator];
  }

  // E230
  public generateTerm(node:Node): boolean {
    // 単項マイナス処理0から引く
    if (node.negation) {
      // 0をプッシュ
      this.addCommand('i', 0, '#単項マイナス用');
    }

    // タイプで分岐
    if (node.type === NodeType.NODE_EXPRESSION) {
      if (!this.generateExpression(node)) {
        return false;
      }
    } else if (node.type === NodeType.NODE_NUMBER) {
      // 数値は即値プッシュ
      this.addCommand('i', node.number, '#即値プッシュ');
    } else if (node.type === NodeType.NODE_FUNCTION) {
      if (!this.generateFunction(node, false)) {
        return false;
      }
    } else {
      // ARRAY_ELEMENT,VARIABLEのアドレスプッシュ処理

      // 変数の定義状態を参照
      if (node.token) { // 変数があるなら
        let name:string = node.token.string;
        if (node.type === NodeType.NODE_OUT) {
          name = '!ret';
        }

        const v:Variable|null = this.mCurrentBlock.findVariable(name);
        // 知らない変数。みつからないか、あるんだがまだその行まで行ってないか。
        if (!v) {
          this.beginError(node);
          throw new Error(`E230:名前付きメモリか定数'${name}'は存在しない。`);
        }

        if (!(v.isDefined())) {
          this.beginError(node);
          throw new Error(`E231:名前付きメモリか定数'${name}'はまだ作られていない。`);
        }

        if (!(v.isInitialized())) {
          this.beginError(node);
          throw new Error(`E232: 名前付きメモリか定数'${name}'は数をセットされる前に使われている。「a->a」みたいなのはダメ。`);
        }
      }

      const params = new OffsetParams();
      if (!this.pushDynamicOffset(params, node)) {
        return false;
      }

      let cmd:string;
      if (params.fpRelative) {
        cmd = 'fld';
      } else {
        cmd = 'ld';
      }

      let comment:string = '\n';
      if (node.token) {
        comment = `#変数'${node.token.string}'からロード`;
      }

      this.addCommand(cmd, params.staticOffset, comment);
    }

    // 単項マイナスがある場合、ここで減算
    if (node.negation) {
      this.addCommand('sub', 0, '#単項マイナス用');
    }

    return true;
  }

  public pushDynamicOffset(params:OffsetParams, node:Node): boolean {
    params.setFpRelative(false);
    params.setStaticOffset(-0x7fffffff); // あからさまにおかしな値を入れておく。デバグのため。

    HLib.assert((node.type === NodeType.NODE_OUT) || (node.type === NodeType.NODE_VARIABLE) || (node.type === NodeType.NODE_ARRAY_ELEMENT), `${__filename}:684`);

    // トークンは数字ですか、名前ですか
    if (node.token) {
      if (node.token.type === TokenType.TOKEN_OUT) {
        const name:string = '!ret';
        const v:Variable|null = this.mCurrentBlock.findVariable(name);
        if (v === null) {
          HLib.assert(false, `${__filename}:710`);
          return false;
        }

        params.setFpRelative(true); // 変数直のみFP相対
        params.setStaticOffset(v.offset());
        this.mOutputExist = true;
      } else if (node.token.type === TokenType.TOKEN_NAME) {
        // 変数の定義状態を参照
        const name:string = node.token.string;
        const v:Variable|null = this.mCurrentBlock.findVariable(name);
        if (v === null) {
          HLib.assert(false, `${__filename}:710`);
          return false;
        }

        // 配列ならExpressionを評価してプッシュ
        if (node.type === NodeType.NODE_ARRAY_ELEMENT) {
          this.addCommand('fld', v.offset(), `#ポインタ'${name}'からロード`);

          if (node.child) { // 変数インデクス
            if (!this.generateExpression(node.child)) { // アドレスオフセットがプッシュされる
              return false;
            }
            this.addCommand('add');
            params.setStaticOffset(0);
          } else { // 定数インデクス
            params.setStaticOffset(node.number);
          }
        } else {
          params.setFpRelative(true); // 変数直のみFP相対
          params.setStaticOffset(v.offset());
        }
      }
    } else {
      // 定数アクセス。トークンがない。
      HLib.assert(node.type === NodeType.NODE_ARRAY_ELEMENT, `${__filename}:721`); // インデクスがない定数アクセスはアドレスではありえない。
      if (node.child) { // 変数インデクス
        if (!this.generateExpression(node.child)) { // アドレスをプッシュ
          return false;
        }
      } else {
        this.addCommand('i', 0, '#絶対アドレスなので0\n'); // 絶対アドレスアクセス
      }
      params.setStaticOffset(node.number);
    }

    return true;
  }

  public beginError(node:any): void {
    const { token } = node;
    HLib.assert(token, `${__filename}:737`);
  }
}
