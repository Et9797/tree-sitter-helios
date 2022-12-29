"""To generate .so for use with language server."""

from tree_sitter import Language

Language.build_library(output_path="./helios-language.so", repo_paths=["."])
