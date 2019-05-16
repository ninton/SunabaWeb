export default class VmCommand {
  label:    string = '';
  name:     string;
  imm:      number = 0;
  comment:  string = '';

  constructor(label:string, name:string, imm:number = 0, comment:string = '') {
    this.label    = label;
    this.name     = name;
    this.imm      = imm;
    this.comment  = comment;
  }
}
