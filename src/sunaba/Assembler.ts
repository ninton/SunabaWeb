import VmCommand from './VmCommand';
import AsmCommand from './AsmCommand';

// E300
export default class Assembler {
    constructor() {
    }

    public assemble(cmds:Array<AsmCommand>): Array<VmCommand> {
        const labelAddressMap = this.collectLabel(cmds);
        const outCmds = this.resolveLabelAddress(cmds, labelAddressMap);

        return {
            result: true,
            commands: outCmds
        };
    }

    // E300
    public collectLabel(cmds:Array<AsmCommand>): any {
        const labelAddressMap:{[key:string]: number;} = {};

        for (let i = 0; i < cmds.length; i += 1) {
            const cmd:AsmCommand = cmds[i];
            if (cmd.name === 'label') {
                if (cmd.imm in labelAddressMap) {
                    throw `E300: label duplicated: ${cmd.imm} `;
                }
                labelAddressMap[cmd.imm] = i;
            }
        }

        return labelAddressMap;
    }

    public resolveLabelAddress(cmds:Array<AsmCommand>, labelAddressMap:any): Array<VmCommand> {
        const outCmds:Array<VmCommand> = [];

        for (let i = 0; i < cmds.length; i += 1) {
            const cmd:VmCommand = Object.assign(cmds[i]);

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
