from langchain_core.tools import tool

from tools.compiler import (
    LatexCompilationError,
    LatexTimeoutError,
    LatexResourceError,
    compile_latex,
)


@tool
def compile_latex_tool(latex: str) -> dict:
    """
    Compiles LaTeX using robust multi-engine compilation with comprehensive error handling.

    Features:
    - Multiple LaTeX engines (pdflatex, xelatex, lualatex)
    - Timeout protection (120s max)
    - Memory monitoring (2GB limit)
    - Automatic package detection
    - Intelligent error recovery
    - Progressive fixes per engine

    Returns dict with success status, pdf_path, error details, and compilation metadata.
    """
    try:
        pdf_path = compile_latex(latex)
        return {
            "success": True,
            "pdf_path": pdf_path,
            "error": "",
            "compilation_method": "robust_multi_engine",
            "features_used": [
                "timeout_protection",
                "memory_monitoring",
                "multi_engine_fallback",
            ],
        }
    except LatexTimeoutError as e:
        return {
            "success": False,
            "pdf_path": "",
            "error": f"TIMEOUT: {str(e)}",
            "error_type": "timeout",
            "suggestion": "Consider simplifying the document or reducing complexity",
        }
    except LatexResourceError as e:
        return {
            "success": False,
            "pdf_path": "",
            "error": f"RESOURCE_LIMIT: {str(e)}",
            "error_type": "resource_limit",
            "suggestion": "Document too complex - try reducing image sizes or table complexity",
        }
    except LatexCompilationError as e:
        return {
            "success": False,
            "pdf_path": "",
            "error": str(e),
            "error_type": "compilation_error",
            "suggestion": "Check LaTeX syntax and package requirements",
        }
    except Exception as e:
        return {
            "success": False,
            "pdf_path": "",
            "error": f"UNEXPECTED_ERROR: {str(e)}",
            "error_type": "system_error",
            "suggestion": "System error occurred - please try again",
        }
