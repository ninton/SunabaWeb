import { chmod } from "fs";

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
const IO_READABLE_BEGIN = IO_BASE;
const IO_WRITABLE_BEGIN = IO_BASE + IO_WRITABLE_OFFSET;

export namespace sunaba {
    export class Machine {            
        program:        Array<any>;
        memory:         Array<number>;
        stack:          Array<number>;
        programCounter: number;
        stackPointer:   number;
        framePointer:   number;

        constructor() {
            this.program = [];
            this.stack = [];
            this.programCounter = 0;
            this.stackPointer = STACK_BASE;
            this.framePointer = 0;
            this.memory = [];

            for (let i = 0; i < FREE_AND_PROGRAM_SIZE + STACK_SIZE; i += 1) {
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
        }

        public step() {
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
                    this.step_ld(cmd);
                    break;

                case 'st':
                    this.step_st(cmd);
                    break;
                }
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
            const v = op0 < op1 ? 1 : 0:
            this.push(v);
            this.programCounter += 1;
        }

        public step_le(cmd:any) {
            const op1 = this.pop();
            const op0 = this.pop();
            const v = op0 <= op1 ? 1 : 0:
            this.push(v);
            this.programCounter += 1;
        }

        public step_eq(cmd:any) {
            const op1 = this.pop();
            const op0 = this.pop();
            const v = op0 === op1 ? 1 : 0:
            this.push(v);
            this.programCounter += 1;
        }

        public step_ne(cmd:any) {
            const op1 = this.pop();
            const op0 = this.pop();
            const v = op0 !== op1 ? 1 : 0:
            this.push(v);
            this.programCounter += 1;
        }

        public step_ld(cmd:any) {
            const op0 = this.pop();
            const addr = op0 + cmd.imm;

            const v = this.loadMemory(addr);
            this.push(v);
            this.programCounter += 1;
        }

        public step_st(cmd:any) {
            const op0 = this.pop();
            const addr = op0 + cmd.imm;
            const v = this.pop();

            this.setMemory(addr, v);
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
        }

        public loadMemory(address:number) {
            return this.memory[address];
        }
    }
}

