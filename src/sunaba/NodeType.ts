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
	NODE_PROGRAM, //[Statement | FunctionDefinition] ...
	//Statement
	NODE_WHILE_STATEMENT, // Expression,Statement...
	NODE_IF_STATEMENT, // Expression,Statement...
	NODE_SUBSTITUTION_STATEMENT, //[ Memory | Variable | ArrayElement ] ,Expression
	NODE_FUNCTION_DEFINITION, //Variable... Statement... [ Return ]
	NODE_EXPRESSION, //Expression, Expression
	NODE_VARIABLE,
	NODE_NUMBER,
	NODE_OUT,
	NODE_ARRAY_ELEMENT, //Expression
	NODE_FUNCTION, //Expression ...

	NODE_UNKNOWN = 99    
}
