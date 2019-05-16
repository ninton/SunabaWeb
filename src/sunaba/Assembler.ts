import Command from './Command';

// E300
export default class Assembler {
    constructor() {
    }

    public assemble(cmds:Array<Command>): any {
        const labelAddressMap = this.collectLabel(cmds);
        const outCmds = this.resolveLabelAddress(cmds, labelAddressMap);

        return {
            result: true,
            commands: outCmds
        };
    }

    // E300
    public collectLabel(cmds:Array<Command>): any {
        const labelAddressMap:{[key:string]: number;} = {};

        for (let i = 0; i < cmds.length; i += 1) {
            const cmd:Command = cmds[i];
            if (cmd.name === 'label') {
                if (cmd.imm in labelAddressMap) {
                    throw `E300: label duplicated: ${cmd.imm} `;
                }
                labelAddressMap[cmd.imm] = i;
            }
        }

        return labelAddressMap;
    }

    public resolveLabelAddress(cmds:Array<Command>, labelAddressMap:any): Array<Command> {
        const outCmds:Array<Command> = [];

        for (let i = 0; i < cmds.length; i += 1) {
            const cmd:Command = Object.assign(cmds[i]);

            if ((cmd.name !== 'label') && (typeof cmd.imm === 'string') && (cmd.imm !== '')) {
                if (cmd.imm in labelAddressMap) {
                    cmd.imm = labelAddressMap[cmd.imm];
                }
            }

            outCmds.push(cmd);
        }

        return outCmds;
    }
}
