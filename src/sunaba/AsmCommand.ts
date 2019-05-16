export default class AsmCommand {
    label:     string;
    name:      string;
    imm:       number|string = 0;
    comment:   string = '';

    constructor(label:string = '', name:string = '', imm:number|string = 0, comment:string = '') {
        this.label   = label;
        this.name    = name;
        this.imm     = imm;
        this.comment = comment;
    }
}
