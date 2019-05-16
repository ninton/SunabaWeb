export default class VmCommand {
    name:      string;
    imm:       number = 0;
    comment:   string = '';

    constructor(name:string, imm:number = 0, comment:string = '') {
        this.name    = name;
        this.imm     = imm;
        this.comment = comment;
    }
}
