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
            if (cmd.label) {
                if (cmd.label in labelAddressMap) {
                    throw `E300: label duplicated: ${cmd.label} `;
                }
                labelAddressMap[cmd.label] = i;
            }
        }

        return labelAddressMap;
    }

    public resolveLabelAddress(cmds:Array<AsmCommand>, labelAddressMap:any): Array<VmCommand> {
        const outCmds:Array<VmCommand> = [];

        for (let i = 0; i < cmds.length; i += 1) {
            const cmd:AsmCommand = cmds[i];
            let imm:number = 0;

            if (typeof cmd.imm === 'string') {
                if (cmd.imm === '') {
                    imm = 0;
                } else if (cmd.imm in labelAddressMap) {
                    imm = labelAddressMap[cmd.imm];
                } else {
                    throw `E302: imm not resolved': ${cmd.name} ${cmd.imm} ${cmd.comment}`;
                }
            } else {
                imm = cmd.imm;
            }

            const vmcmd:VmCommand = new VmCommand(cmd.label, cmd.name, imm, cmd.comment);
            outCmds.push(vmcmd);
        }

        return outCmds;
    }
}
