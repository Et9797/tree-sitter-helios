#include <tree_sitter/parser.h>
#include <wctype.h>

enum TokenType {
  DUMMY_TOKEN
};

void *tree_sitter_helios_external_scanner_create() { return NULL; }
void tree_sitter_helios_external_scanner_destroy(void *p) {}
void tree_sitter_helios_external_scanner_reset(void *p) {}
unsigned tree_sitter_helios_external_scanner_serialize(void *p, char *buffer) { return 0; }
void tree_sitter_helios_external_scanner_deserialize(void *p, const char *b, unsigned n) {}

static void advance(TSLexer *lexer) { lexer->advance(lexer, false); }
static void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

static bool scan_dummy_token(TSLexer *lexer) {
  // Check if the next character is an alphabetical character
  if (iswalpha(lexer->lookahead) || lexer->lookahead == '_') {
    // Return false to indicate that the dummy token should not be inserted
    return false;
  }

  // Set the result symbol to the dummy token
  lexer->result_symbol = DUMMY_TOKEN;
  lexer->mark_end(lexer);

  return true;
}

bool tree_sitter_helios_external_scanner_scan(
	void *payload, TSLexer *lexer, const bool *valid_symbols
) {
	if (scan_dummy_token(lexer))
		return true;
}
