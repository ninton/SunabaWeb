export enum TermType {
    TERM_EXPRESSION,
	TERM_NUMBER,
	TERM_FUNCTION,
	TERM_ARRAY_ELEMENT,
	TERM_VARIABLE,
	TERM_OUT,

	TERM_UNKNOWN = 99   
}

export enum StatementType {
	STATEMENT_WHILE_OR_IF,
	STATEMENT_DEF,
	STATEMENT_CONST,
	STATEMENT_FUNCTION,
    STATEMENT_SUBSTITUTION,
    
	STATEMENT_UNKNOWN = 99
}

export enum NodeType {
	// test/fixture/??_vmcode.json に記述しているので、値を固定した
	NODE_PROGRAM                = 0,
	NODE_WHILE_STATEMENT        = 1,
	NODE_IF_STATEMENT           = 2,
	NODE_SUBSTITUTION_STATEMENT = 3,
	NODE_FUNCTION_DEFINITION    = 4,
	NODE_EXPRESSION             = 5,
	NODE_VARIABLE               = 6,
	NODE_NUMBER                 = 7,
	NODE_OUT                    = 8,
	NODE_ARRAY_ELEMENT          = 9,
	NODE_FUNCTION               = 10,

	NODE_UNKNOWN                = 99
}
