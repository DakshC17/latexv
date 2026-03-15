from langchain_core.tools import tool

from tools.compiler import LatexCompilationError, compile_latex


@tool
def compile_latex_tool(latex: str) -> dict:
    """Compiles a LaTeX string using pdflatex. Returns pdf_path on success or error on failure."""
    try:
        pdf_path = compile_latex(latex)
        return {"success": True, "pdf_path": pdf_path, "error": ""}
    except LatexCompilationError as e:
        return {"success": False, "pdf_path": "", "error": str(e)}
