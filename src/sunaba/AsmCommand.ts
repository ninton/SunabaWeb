export default class AsmCommand {
    name:      string;
    imm:       number|string = 0;
    comment:   string = '';

    constructor(name:string, imm:string|number = '', comment:string = '') {
        this.name    = name;
        this.imm     = imm;
        this.comment = comment;
    }
}
