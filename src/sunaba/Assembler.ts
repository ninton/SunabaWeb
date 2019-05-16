/* eslint
   no-unused-vars: 0,
   class-methods-use-this: 0
*/
import VmCommand from './VmCommand';
import AsmCommand from './AsmCommand';

// E300
export default class Assembler {
  public assemble(asmCmds:Array<AsmCommand>): Array<VmCommand> {
    const labelAddressMap = this.collectLabel(asmCmds);
    const vmCmds:Array<VmCommand> = this.resolveLabelAddress(asmCmds, labelAddressMap);

    return vmCmds;
  }

  // E300
  public collectLabel(asmCmds:Array<AsmCommand>): {[key:string]: number;} {
    const labelAddressMap:{[key:string]: number;} = {};

    for (let i = 0; i < asmCmds.length; i += 1) {
      const cmd:AsmCommand = asmCmds[i];
      if (cmd.label) {
        if (cmd.label in labelAddressMap) {
          throw new Error(`E300: label duplicated: ${cmd.label}`);
        }
        labelAddressMap[cmd.label] = i;
      }
    }

    return labelAddressMap;
  }

  public resolveLabelAddress(asmCmds:Array<AsmCommand>, labelAddressMap:any): Array<VmCommand> {
    const outCmds:Array<VmCommand> = [];

    for (let i = 0; i < asmCmds.length; i += 1) {
      const asmCmd:AsmCommand = asmCmds[i];
      let vmcmd_imm:number = 0;

      if (typeof asmCmd.imm === 'string') {
        if (asmCmd.imm === '') {
          vmcmd_imm = 0;
        } else if (asmCmd.imm in labelAddressMap) {
          vmcmd_imm = labelAddressMap[asmCmd.imm];
        } else {
          throw new Error(`E302: imm not resolved': ${asmCmd.name} ${asmCmd.imm} ${asmCmd.comment}`);
        }
      } else {
        vmcmd_imm = asmCmd.imm;
      }

      const vmcmd:VmCommand = new VmCommand(asmCmd.label, asmCmd.name, vmcmd_imm, asmCmd.comment);
      outCmds.push(vmcmd);
    }

    return outCmds;
  }
}
