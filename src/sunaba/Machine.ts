/* eslint
    no-unused-vars: 0
*/
import VmCommand from './VmCommand';

// 設定定数。ただし、いじるとIOメモリの番号が変わるので、ソースコードが非互換になる。
const FREE_AND_PROGRAM_SIZE = 40000;
const STACK_SIZE            = 10000;
const IO_MEMORY_SIZE        = 10000;
const IO_WRITABLE_OFFSET    =  5000;
const SCREEN_WIDTH          =   100;
const SCREEN_HEIGHT         =   100;
const MAX_CALL_COUNT        =   256;

// 自動計算定数類
const STACK_BASE        = FREE_AND_PROGRAM_SIZE;
const STACK_END         = STACK_BASE + STACK_SIZE;
const IO_BASE           = STACK_END;
const IO_END            = IO_BASE + IO_MEMORY_SIZE;
const IO_WRITABLE_BEGIN = IO_BASE + IO_WRITABLE_OFFSET;
const VRAM_BASE         = IO_END;
const VRAM_SIZE         = SCREEN_HEIGHT * SCREEN_WIDTH;

const OUTPUT_MAP:{[key:number]: string;} = {
  55000: 'sync',
  55001: 'autosync_disable',
  55002: 'debug',
};

const INPUT_MAP:{[key:number]: string;} = {
  50000: 'mouse_x',
  50001: 'mouse_y',
  50002: 'mouse_left',
  50003: 'mouse_right',
  50004: 'key_up',
  50005: 'key_down',
  50006: 'key_left',
  50007: 'key_right',
  50008: 'key_space',
  50009: 'key_enter',
};

export default class Machine {
  VRAM_BASE:        number;
  STACK_BASE:       number;

  program:          Array<any>;
  memory:           Array<number>;
  programCounter:   number;
  stackPointer:     number;
  framePointer:     number;
  vramListener:     (addr:number, value:number) => void;
  onOutputListener: (name:string, value:number) => void;
  messageHandler:   (mesg:string) => void;
  callCount:        number;
  isRunning:        boolean;
  onInputListener:  (name:string) => number;

  constructor() {
    this.VRAM_BASE  = VRAM_BASE;
    this.STACK_BASE = STACK_BASE;

    this.program          = [];
    this.memory           = [];
    this.programCounter   = 0;
    this.stackPointer     = STACK_BASE;
    this.framePointer     = 0;
    this.vramListener     = () => {};
    this.onOutputListener = () => {};
    this.messageHandler   = () => {};

    this.clearMemory();
    this.callCount = 0;
    this.isRunning = false;
    this.onInputListener = () => 0;
  }

  public push(v:number) {
    if (this.stackPointer >= STACK_END) {
      throw new Error('E901: スタックを使い切った。名前つきメモリを使いすぎ。');
    } else {
      this.memory[this.stackPointer] = v;
      this.stackPointer += 1;
    }
  }

  public pop(): number {
    if (this.stackPointer <= STACK_BASE) {
      throw new Error('E902: ポップしすぎてスタック領域をはみ出した。');
    } else {
      this.stackPointer -= 1;
      return this.memory[this.stackPointer];
    }
  }

  public popN(n:number) {
    if ((this.stackPointer - n) < STACK_BASE) {
      throw new Error('E903: ポップしすぎてスタック領域をはみ出した。');
    } else if ((this.stackPointer - n) >= STACK_END) {
      throw new Error('E904: スタックを使い切った。名前つきメモリを使いすぎ。');
    } else {
      this.stackPointer -= n;
    }
  }

  public clearMemory() {
    for (let i = 0; i < FREE_AND_PROGRAM_SIZE + STACK_SIZE + VRAM_SIZE; i += 1) {
      this.memory[i] = 0;
    }
  }

  public loadProgram(program:Array<any>) {
    this.clearMemory();
    this.program = program;
    this.programCounter = 0;
    this.stackPointer = STACK_BASE;
    this.framePointer = 0;
    this.messageHandler('プログラムを起動');
    this.isRunning = true;
  }

  public stop() {
    if (this.isRunning) {
      this.messageHandler('プログラムを中止しました');
    }
    this.isRunning = false;
  }

  public step() {
    if (!this.isRunning) {
      return;
    }

    try {
      this.stepMain();
    } catch (e) {
      this.messageHandler(e.toString());
      this.messageHandler('エラーのため停止');
      this.isRunning = false;
    }
  }

  public stepMain() {
    if (!this.isRunning) {
      return;
    }
    if (this.program.length <= this.programCounter) {
      return;
    }

    const cmd = this.program[this.programCounter];
    switch (cmd.name) {
      case 'i':
        this.step_i(cmd);
        break;

      case 'add':
        this.step_add();
        break;

      case 'sub':
        this.step_sub();
        break;

      case 'mul':
        this.step_mul();
        break;

      case 'div':
        this.step_div();
        break;

      case 'lt':
        this.step_lt();
        break;

      case 'le':
        this.step_le();
        break;

      case 'eq':
        this.step_eq();
        break;

      case 'ne':
        this.step_ne();
        break;

      case 'ld':
      case 'fld':
        this.step_ld(cmd);
        break;

      case 'st':
      case 'fst':
        this.step_st(cmd);
        break;

      case 'j':
        this.step_j(cmd);
        break;

      case 'bz':
        this.step_bz(cmd);
        break;

      case 'call':
        this.step_call(cmd);
        break;

      case 'ret':
        this.step_ret(cmd);
        break;

      case 'pop':
        this.step_pop(cmd);
        break;

      default:
        this.noop();
        break;
    }

    if (this.program.length <= this.programCounter) {
      this.isRunning = false;
      this.messageHandler('プログラムが最後まで実行された。');
    }
  }

  public noop() {
    this.programCounter += 1;
  }

  public step_i(cmd:VmCommand) {
    this.push(cmd.imm);
    this.programCounter += 1;
  }

  public step_add() {
    const op1 = this.pop();
    const op0 = this.pop();
    const v = op0 + op1;
    this.push(v);
    this.programCounter += 1;
  }

  public step_sub() {
    const op1 = this.pop();
    const op0 = this.pop();
    const v = op0 - op1;
    this.push(v);
    this.programCounter += 1;
  }

  public step_mul() {
    const op1 = this.pop();
    const op0 = this.pop();
    const v = op0 * op1;
    this.push(v);
    this.programCounter += 1;
  }

  // E910
  public step_div() {
    const op1 = this.pop();
    const op0 = this.pop();
    if (op1 === 0) {
      throw new Error('E910: 0で割ろうとした。');
    }
    const v = Math.floor(op0 / op1);
    this.push(v);
    this.programCounter += 1;
  }

  public step_lt() {
    const op1 = this.pop();
    const op0 = this.pop();
    const v = op0 < op1 ? 1 : 0;
    this.push(v);
    this.programCounter += 1;
  }

  public step_le() {
    const op1 = this.pop();
    const op0 = this.pop();
    const v = op0 <= op1 ? 1 : 0;
    this.push(v);
    this.programCounter += 1;
  }

  public step_eq() {
    const op1 = this.pop();
    const op0 = this.pop();
    const v = op0 === op1 ? 1 : 0;
    this.push(v);
    this.programCounter += 1;
  }

  public step_ne() {
    const op1 = this.pop();
    const op0 = this.pop();
    const v = op0 !== op1 ? 1 : 0;
    this.push(v);
    this.programCounter += 1;
  }

  public step_ld(cmd:VmCommand) {
    const op0 = this.pop_or_framepointer(cmd.name);
    const addr = op0 + cmd.imm;

    this.validate_read_address(addr);
    const v = this.loadMemory(addr);
    this.push(v);
    this.programCounter += 1;
  }

  // E920
  private validate_read_address(addr:number): void {
    if (addr < 0) {
      throw new Error(`E920: マイナスの番号のメモリを読みとろうとした(番号:'${addr})`);
    }

    if (addr < STACK_BASE) {
      // データ＋プログラム領域
      // js版は、プログラムをメモリにロードしないので、この領域はすべてデータとして使える
      // throw new Error(`E921: プログラムが入っているメモリを読みとろうとした(番号:${addr})`;
      return;
    }

    if (addr < IO_BASE) {
      // スタック領域
      return;
    }

    if (addr < IO_WRITABLE_BEGIN) {
      // IO_READ領域
      return;
    }

    if (addr < VRAM_BASE) {
      // IO_WRITE領域
      throw new Error(`E922: このあたりのメモリはセットはできるが読み取ることはできない(番号:${addr})`);
    }

    if (addr < VRAM_BASE + VRAM_SIZE) {
      // VRAM領域
      throw new Error(`E923: 画面メモリは読み取れない(番号:${addr})`);
    }

    throw new Error(`E929: メモリ範囲外を読みとろうとした(番号:${addr})`);
  }

  private pop_or_framepointer(cmd_name:string) {
    let op:number;

    switch (cmd_name) {
      case 'ld':
      case 'st':
        op = this.pop();
        break;
      case 'fld':
      case 'fst':
        op = this.framePointer;
        break;
      default:
        throw new Error(`step_ld/step_st: unknown name: ${cmd_name}`);
    }
    return op;
  }

  public step_st(cmd:VmCommand) {
    const op1 = this.pop();
    const val  = op1;

    const op0 = this.pop_or_framepointer(cmd.name);
    const addr = op0 + cmd.imm;

    this.validate_write_address(addr, val);
    this.setMemory(addr, val);
    this.programCounter += 1;
  }

  // E930
  private validate_write_address(addr:number, value:number): void {
    if (addr < 0) {
      throw new Error(`E930: マイナスの番号のメモリを変えようとした(番号:${addr},値:${value})`);
    }

    if (addr < STACK_BASE) {
      // データ＋プログラム領域
      // js版は、プログラムをメモリにロードしないので、この領域はすべてデータとして使える
      // throw new Error(`E931: プログラムが入っているメモリにセットしようとした(番号:${addr},値:${value})`);
      return;
    }

    if (addr < IO_BASE) {
      // スタック領域
      return;
    }

    if (addr < IO_WRITABLE_BEGIN) {
      // IO_READ領域
      throw new Error(`E932: このあたりのメモリはセットできない(番号:${addr},値:${value})`);
    }

    if (addr < VRAM_BASE) {
      // IO_WRITE領域
      return;
    }

    if (addr < VRAM_BASE + VRAM_SIZE) {
      // VRAM領域
      return;
    }

    throw new Error(`E939: メモリ範囲外をいじろうとした(番号:${addr},値:${value})`);
  }

  public step_j(cmd:VmCommand) {
    this.programCounter = cmd.imm;
  }

  public step_bz(cmd:VmCommand) {
    const op0 = this.pop();
    if (op0 === 0) {
      this.programCounter = cmd.imm;
    } else {
      this.programCounter += 1;
    }
  }

  public step_call(cmd:VmCommand) {
    this.push(this.framePointer);
    this.push(this.programCounter);
    this.framePointer = this.stackPointer;
    this.programCounter = cmd.imm;

    this.callCount += 1;
    if (MAX_CALL_COUNT <= this.callCount) {
      throw new Error(`部分プログラムを激しく呼びすぎ。たぶん再帰に間違いがある(命令:${this.programCounter})`);
    }
  }

  public step_ret(cmd:VmCommand) {
    this.popN(cmd.imm);
    this.programCounter = this.pop();
    this.framePointer = this.pop();

    this.callCount -= 1;
    if (this.callCount < 0) {
      throw new Error(`ret命令が多すぎている。絶対おかしい(命令:${this.programCounter})`);
    }

    this.programCounter += 1;
  }

  public step_pop(cmd:VmCommand) {
    this.popN(cmd.imm);
    this.programCounter += 1;
  }

  public getStack(): Array<number> {
    const stack = [];
    for (let i = 0; i < this.stackPointer - STACK_BASE; i += 1) {
      stack[i] = this.memory[STACK_BASE + i];
    }
    return stack;
  }

  public setMemory(address:number, value:number) {
    this.memory[address] = value;
    if (VRAM_BASE <= address) {
      this.vramListener(address - VRAM_BASE, value);
    } else if (address in OUTPUT_MAP) {
      const name = OUTPUT_MAP[address];
      this.onOutputListener(name, value);
    }
  }

  public loadMemory(address:number): number {
    if (address in INPUT_MAP) {
      const name:string = INPUT_MAP[address];
      const value:number = this.onInputListener(name);
      return value;
    }
    return this.memory[address];
  }

  public setVramListener(fn: (addr:number, value:number) => void) {
    this.vramListener = fn;
  }

  public getProgramCounter(): number {
    return this.programCounter;
  }

  public getStackPointer(): number {
    return this.stackPointer;
  }

  public getFramePointer(): number {
    return this.framePointer;
  }

  public setFramePointer(value:number) {
    this.framePointer = value;
  }

  public setMessageHandler(messageHandler:(mesg:string) => void) {
    this.messageHandler = messageHandler;
  }

  public setOnInputListener(fn:(name:string) => number) {
    this.onInputListener = fn;
  }

  public setOnOutputListener(fn: (name:string, value:number) => void) {
    this.onOutputListener = fn;
  }
}
