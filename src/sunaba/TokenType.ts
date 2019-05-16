/* eslint no-unused-vars: 0 */

enum TokenType {
  // 特定の文字列と対応する種類
  TOKEN_WHILE_PRE = 0,
  TOKEN_WHILE_POST,		// なかぎり
  TOKEN_IF_PRE,
  TOKEN_IF_POST,		// なら
  TOKEN_DEF_PRE,

  TOKEN_DEF_POST = 5,	// とは
  TOKEN_CONST,
  TOKEN_INCLUDE,
  TOKEN_LEFT_BRACKET,
  TOKEN_RIGHT_BRACKET,

  TOKEN_COMMA = 10,
  TOKEN_INDEX_BEGIN,
  TOKEN_INDEX_END,
  TOKEN_SUBSTITUTION,	// ->か→か⇒
  TOKEN_OUT,

  // 実際の内容が様々であるような種類
  TOKEN_NAME = 15,
  TOKEN_STRING_LITERAL, // 文字列リテラル
  TOKEN_NUMBER,
  TOKEN_OPERATOR,
  TOKEN_STATEMENT_END,	// Structurizerで自動挿入される種類

  TOKEN_BLOCK_BEGIN = 20,
  TOKEN_BLOCK_END,
  TOKEN_LINE_BEGIN,
  TOKEN_END,

  TOKEN_UNKNOWN = 99,
  TOKEN_LARGE_NUMBER 	// エラーメッセージ用
}

export default TokenType;
