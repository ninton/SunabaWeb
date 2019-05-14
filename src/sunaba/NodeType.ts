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
	NODE_PROGRAM = 0, //[Statement | FunctionDefinition] ...
	//Statement
	NODE_WHILE_STATEMENT = 1, // Expression,Statement...
	NODE_IF_STATEMENT = 2, // Expression,Statement...
	NODE_SUBSTITUTION_STATEMENT = 3, //[ Memory | Variable | ArrayElement ] ,Expression
	NODE_FUNCTION_DEFINITION = 4, //Variable... Statement... [ Return ]
	NODE_EXPRESSION = 5, //Expression, Expression
	NODE_VARIABLE = 6,
	NODE_NUMBER = 7,
	NODE_OUT = 8,
	NODE_ARRAY_ELEMENT = 9, //Expression
	NODE_FUNCTION = 10, //Expression ...

	NODE_UNKNOWN = 99    
}
