export default class Locale {
    whileWord0  : string;
    whileWord1  : string;
    whileAtHead : boolean;
    ifWord      : string;
    ifAtHead    : boolean;
    defWord     : string;
    defAtHead   : boolean;
    constWord   : string;
    outWord     : string;
    memoryWord  : string;
    argDelimiter: string;

    constructor() {
        // new Locale()することはないが、syntax error対策
        // TS2564: Property 'whileWord0' has no initializer and is not definitely assigned in the constructor.
        this.whileWord0   = '';
        this.whileWord1   = '';
        this.whileAtHead  = false;
        this.ifWord       = '';
        this.ifAtHead     = false;
        this.defWord      = '';
        this.defAtHead    = false;
        this.constWord    = '';
        this.outWord      = '';
        this.memoryWord   = '';
        this.argDelimiter = '';
    }
}
