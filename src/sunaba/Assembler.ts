// E300
export default class Assembler {
    constructor() {
    }

    public assemble(cmds:Array<any>): any {
        const labelAddressMap = this.collectLabel(cmds);
        const outCmds = this.resolveLabelAddress(cmds, labelAddressMap);

        return {
            result: true,
            commands: outCmds
        };
    }

    // E300
    public collectLabel(cmds:Array<any>): any {
        const labelAddressMap:{[key:string]: number;} = {};

        for (let i = 0; i < cmds.length; i += 1) {
            const cmd = cmds[i];
            if (cmd.name === 'label') {
                if (cmd.imm in labelAddressMap) {
                    throw `E300: label duplicated: ${cmd.imm} `;
                }
                labelAddressMap[cmd.imm] = i;
            }
        }

        return labelAddressMap;
    }

    public resolveLabelAddress(cmds:Array<any>, labelAddressMap:any): Array<any> {
        const outCmds:Array<any> = [];

        for (let i = 0; i < cmds.length; i += 1) {
            const cmd = Object.assign(cmds[i]);

            if (cmd.name !== 'label') {
                if (cmd.imm in labelAddressMap) {
                    cmd.imm = labelAddressMap[cmd.imm];
                }
            }

            outCmds.push(cmd);
        }

        return outCmds;
    }
}
