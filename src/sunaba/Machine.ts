const FREE_AND_PROGRAM_SIZE = 40000;
const STACK_SIZE            = 10000;
const IO_MEMORY_SIZE        = 10000;
const IO_WRITABLE_OFFSET    = 5000;
const EXECUTION_UNIT        = 10000;

//自動計算定数類
const STACK_BASE = FREE_AND_PROGRAM_SIZE;
const STACK_END  = STACK_BASE + STACK_SIZE;
const IO_BASE    = STACK_END;
const IO_END     = IO_BASE + IO_MEMORY_SIZE;
const VRAM_BASE  = IO_END;
const VRAM_SIZE  = 100 * 100;
const IO_READABLE_BEGIN = IO_BASE;
const IO_WRITABLE_BEGIN = IO_BASE + IO_WRITABLE_OFFSET;

export default class Machine {
    VRAM_BASE:      number;
    STACK_BASE:     number;

    program:        Array<any>;
    memory:         Array<number>;
    programCounter: number;
    stackPointer:   number;
    framePointer:   number;
    vramDrawer:     Function;
    messageHandler: Function;

    constructor() {
        this.VRAM_BASE  = VRAM_BASE;
        this.STACK_BASE = STACK_BASE;

        this.program        = [];
        this.memory         = [];
        this.programCounter = 0;
        this.stackPointer   = STACK_BASE;
        this.framePointer   = 0;
        this.vramDrawer     = () => {};
        this.messageHandler = (mesg:string) => {
            //console.log(mesg);
        };

        for (let i = 0; i < FREE_AND_PROGRAM_SIZE + STACK_SIZE + VRAM_SIZE; i += 1) {
            this.memory[i] = 10000 + i;
        }
    }

    public push(v:number) {
        if (this.stackPointer >= STACK_END) {
            // TODO
        } else {
            this.memory[this.stackPointer] = v;
            this.stackPointer += 1;
        }
    }

    public pop(): number {
        if (this.stackPointer <= STACK_BASE){
            // TODO
            return 0;
        } else {
            this.stackPointer -= 1;
            return this.memory[this.stackPointer];
        }
    }

    public popN(n:number) {
        if ((this.stackPointer - n) < STACK_BASE){
            // TODO
        } else if ((this.stackPointer - n) >= STACK_END){
            // TODO
        }else{
            this.stackPointer -= n;
        }
    }

    public loadProgram(program:Array<any>) {
        this.program = program;
        this.programCounter = 0;
        this.stackPointer = STACK_BASE;
        this.framePointer = 0;
        this.messageHandler('プログラムを起動');
    }

    public step() {
        try {
            this.stepMain();
        } catch (e) {
            this.messageHandler(e);
        }
    }

    public stepMain() {
        if (this.program.length <= this.programCounter) {
            return;
        }

        const cmd = this.program[this.programCounter];
        switch (cmd.name) {
            case 'i':
                this.step_i(cmd);
                break;
            
            case 'add':
                this.step_add(cmd);
                break;
            
            case 'sub':
                this.step_sub(cmd);
                break;

            case 'mul':
                this.step_mul(cmd);
                break;

            case 'div':
                this.step_div(cmd);
                break;

            case 'lt':
                this.step_lt(cmd);
                break;

            case 'le':
                this.step_le(cmd);
                break;

            case 'eq':
                this.step_eq(cmd);
                break;

            case 'ne':
                this.step_ne(cmd);
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
            
            case 'label':
                this.noop();
                break;
        }

        if (this.program.length <= this.programCounter) {
            this.messageHandler('プログラムが最後まで実行された。');
        }
    }

    public noop() {
        this.programCounter += 1;
    }

    public step_i(cmd:any) {
        this.push(cmd.imm);
        this.programCounter += 1;
    }

    public step_add(cmd:any) {
        const op1 = this.pop();
        const op0 = this.pop();
        const v = op0 + op1;
        this.push(v);
        this.programCounter += 1;
    }

    public step_sub(cmd:any) {
        const op1 = this.pop();
        const op0 = this.pop();
        const v = op0 - op1;
        this.push(v);
        this.programCounter += 1;
    }

    public step_mul(cmd:any) {
        const op1 = this.pop();
        const op0 = this.pop();
        const v = op0 * op1;
        this.push(v);
        this.programCounter += 1;
    }

    public step_div(cmd:any) {
        const op1 = this.pop();
        const op0 = this.pop();
        if (op1 === 0) {
            // TODO:
        }
        const v = op0 / op1;
        this.push(v);
        this.programCounter += 1;
    }

    public step_lt(cmd:any) {
        const op1 = this.pop();
        const op0 = this.pop();
        const v = op0 < op1 ? 1 : 0;
        this.push(v);
        this.programCounter += 1;
    }

    public step_le(cmd:any) {
        const op1 = this.pop();
        const op0 = this.pop();
        const v = op0 <= op1 ? 1 : 0;
        this.push(v);
        this.programCounter += 1;
    }

    public step_eq(cmd:any) {
        const op1 = this.pop();
        const op0 = this.pop();
        const v = op0 === op1 ? 1 : 0;
        this.push(v);
        this.programCounter += 1;
    }

    public step_ne(cmd:any) {
        const op1 = this.pop();
        const op0 = this.pop();
        const v = op0 !== op1 ? 1 : 0;
        this.push(v);
        this.programCounter += 1;
    }

    public step_ld(cmd:any) {
        const op0 = this.pop_or_framepointer(cmd.name);
        const addr = op0 + cmd.imm;
        const v = this.loadMemory(addr);
        this.push(v);
        this.programCounter += 1;
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
                throw 'step_ld/step_st: unknown name: ' + cmd_name;
        }
        return op;
    }

    public step_st(cmd:any) {
        const op1 = this.pop();
        const val  = op1;

        const op0 = this.pop_or_framepointer(cmd.name);
        const addr = op0 + cmd.imm;

        this.setMemory(addr, val);
        this.programCounter += 1;
    }

    public step_j(cmd:any) {
        this.programCounter = cmd.imm;
    }

    public step_bz(cmd:any) {
        const op0 = this.pop();
        if (op0 === 0) {
            this.programCounter = cmd.imm;
        } else {
            this.programCounter += 1;
        }
    }

    public step_call(cmd:any) {
        this.push(this.framePointer);
        this.push(this.programCounter);
        this.framePointer = this.stackPointer;
        this.programCounter = cmd.imm;
    }

    public step_ret(cmd:any) {
        this.popN(cmd.imm);
        this.programCounter = this.pop();
        this.framePointer = this.pop();
    }

    public step_pop(cmd:any) {
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
            this.vramDrawer(address - VRAM_BASE, value);
        }
    }

    public loadMemory(address:number) {
        return this.memory[address];
    }

    public setVramDrawer(drawer: Function) {
        this.vramDrawer = drawer;
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

    public setMessageHandler(messageHandler:Function) {
        this.messageHandler = messageHandler;
    }
}
