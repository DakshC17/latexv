import os
import re
import time
import math

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from graph.state import LatexAgentState
from tools.latex_tools import compile_latex_tool

load_dotenv()

_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.7,
)

# Enhanced system prompt with more comprehensive package support
_GENERATE_SYSTEM = (
    "You are a LaTeX document generator with conversation memory and enhanced robustness.\n"
    "Return ONLY valid, compilable LaTeX code - no explanations, no markdown fences.\n"
    "Always include \\documentclass, \\begin{document}, and \\end{document}.\n\n"
    "COMPREHENSIVE PACKAGE SUPPORT (all allowed):\n"
    "Core: inputenc, fontenc, lmodern, babel, ifthen, calc\n"
    "Layout: geometry, changepage, indentfirst, setspace, fancyhdr\n"
    "Math: amsmath, amssymb, amsfonts, bm, mathrsfs, esint, accents\n"
    "Text: textcomp, marvosym, wasysym, pifont, dingbat, microtype\n"
    "Lists: enumitem, paralist\n"
    "Tables: tabularx, booktabs, multirow, hhline, array, longtable\n"
    "Graphics: graphicx, xcolor, tikz, caption, subcaption\n"
    "Code: listings, verbatim, color\n"
    "Layout: ragged2e, url, hyperref, pdfpages\n"
    "Testing: lipsum, blindtext\n\n"
    "ENHANCED COMPILATION FEATURES:\n"
    "- Multiple LaTeX engines available: pdflatex, xelatex, lualatex\n"
    "- Automatic package installation hints\n"
    "- Intelligent error recovery with multiple retry strategies\n"
    "- Timeout protection for complex documents\n"
    "- Memory usage monitoring\n\n"
    "CRITICAL RULES - STRICTLY FOLLOW:\n"
    "1. Text formatting: \\textbf{text}, \\textit{text}, \\underline{text}, \\texttt{text}\n"
    "2. Lists: itemize/enumerate (max 3 levels with proper nesting)\n"
    "3. Math: equation, align, gather environments with amsmath\n"
    "4. Tables: tabular with booktabs (\\toprule, \\midrule, \\bottomrule)\n"
    "5. Images: \\includegraphics[width=X\\textwidth]{filename}\n"
    "6. Special chars: \\%, \\&, \\#, \\$, \\{, \\}\n"
    "7. NEVER use \\justify or \\Justifying - use \\raggedright or \\centering\n"
    "8. Use UTF-8 encoding for international characters\n"
    "9. Build upon conversation history when referencing previous documents\n"
    "10. For edits, modify only requested parts - preserve existing structure\n\n"
    "ROBUST PATTERNS:\n"
    "\\documentclass[11pt]{article}\n"
    "\\usepackage[utf8]{inputenc}\n"
    "\\usepackage{amsmath, amssymb, graphicx}\n"
    "\\usepackage[margin=1in]{geometry}\n"
    "\\begin{document}\n"
    "\\title{Document Title}\n"
    "\\author{Author Name}\n"
    "\\date{\\today}\n"
    "\\maketitle\n"
    "\\section{Introduction}\n"
    "Content here with proper structure.\n"
    "\\end{document}"
)

# Enhanced fix system with better error categorization
_FIX_SYSTEM = (
    "You are an advanced LaTeX error fixer with comprehensive error recovery.\n"
    "You will receive LaTeX code and error details. Analyze and fix intelligently.\n"
    "Return ONLY the corrected LaTeX code - no explanations, no markdown fences.\n\n"
    "ERROR CLASSIFICATION AND FIXES:\n"
    "1. MISSING PACKAGES: Add \\usepackage{...} after \\documentclass\n"
    "2. ENCODING ERRORS: Fix special characters, use UTF-8 compatible alternatives\n"
    "3. MATH ERRORS: Ensure proper math mode, fix amsmath syntax\n"
    "4. TABLE ERRORS: Fix column alignment, check & separators and \\\\ endings\n"
    "5. FIGURE ERRORS: Ensure proper graphics inclusion and float positioning\n"
    "6. SYNTAX ERRORS: Balance braces {}, fix undefined commands\n"
    "7. FONT ERRORS: Remove problematic font packages, use fallbacks\n\n"
    "INTELLIGENT RECOVERY STRATEGIES:\n"
    "- Replace problematic UTF-8 chars: curly quotes to straight quotes, em/en dashes to hyphens\n"
    "- Remove T1 fontenc if causing font issues\n"
    "- Add missing math packages for equations\n"
    "- Fix table structure and booktabs usage\n"
    "- Escape special characters properly\n"
    "- Use standard document classes if custom ones fail\n\n"
    "CRITICAL RULES:\n"
    "1. PRESERVE STRUCTURE: Only fix the specific error, keep rest intact\n"
    "2. ADD MISSING PACKAGES: Insert \\usepackage{...} where needed\n"
    "3. MAINTAIN COMPATIBILITY: Ensure fixes work across LaTeX engines\n"
    "4. CONSERVATIVE CHANGES: Minimal modifications to achieve compilation\n"
    "5. PROPER ENCODING: Handle international characters correctly\n"
    "6. BALANCED SYNTAX: Ensure all braces, brackets, environments are closed\n"
    "7. NO EXPERIMENTAL FEATURES: Stick to well-supported LaTeX features\n"
    "8. ERROR-SPECIFIC FIXES: Target the exact issue mentioned in error log\n"
    "9. FALLBACK COMPATIBILITY: Ensure code works with basic LaTeX distributions\n"
    "10. INCREMENTAL FIXES: Make one targeted fix at a time"
)


def _clean(text: str) -> str:
    """Enhanced text cleaning with robust sanitization."""
    # Remove code fences
    cleaned = re.sub(
        r"^```(?:latex)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE
    ).strip()

    # Remove problematic justify commands
    cleaned = re.sub(r"\\justify\b", "", cleaned)
    cleaned = re.sub(r"\\Justifying\b", "", cleaned)
    cleaned = re.sub(r"\bJustifying\b", "", cleaned)

    # Clean up excessive whitespace
    cleaned = re.sub(r"\n\n\n+", "\n\n", cleaned)
    cleaned = re.sub(r"[ \t]+\n", "\n", cleaned)

    # Fix common encoding issues
    char_fixes = {
        """: "``",
        """: "''",
        "'": "`",
        "'": "'",
        "–": "--",
        "—": "---",
        "…": "\\ldots",
        "©": "\\copyright",
        "®": "\\textregistered",
        "™": "\\texttrademark",
    }

    for old_char, new_char in char_fixes.items():
        cleaned = cleaned.replace(old_char, new_char)

    return cleaned.strip()


def generate_node(state: LatexAgentState) -> LatexAgentState:
    """Enhanced generation node with better error handling."""
    try:
        response = _llm.invoke(
            [
                SystemMessage(content=_GENERATE_SYSTEM),
                HumanMessage(content=state["prompt"]),
            ]
        )
        latex = _clean(str(response.content))
        print(f"[INFO] Generated LaTeX document ({len(latex)} characters)")
        return {**state, "latex": latex, "status": "compiling"}
    except Exception as e:
        print(f"[ERROR] Generation failed: {e}")
        return {**state, "error": f"Generation failed: {e}", "status": "error"}


def compile_node(state: LatexAgentState) -> LatexAgentState:
    """Enhanced compilation node with robust engine handling."""
    print(f"[INFO] Compiling LaTeX (attempt {state['retries'] + 1})...")

    try:
        result = compile_latex_tool.invoke({"latex": state["latex"]})
        if result["success"]:
            print(
                f"[SUCCESS] Compilation successful: {result.get('pdf_path', 'PDF generated')}"
            )
            return {
                **state,
                "pdf_path": result["pdf_path"],
                "error": "",
                "status": "done",
            }
        else:
            print(f"[ERROR] Compilation failed: {result.get('error', 'Unknown error')}")
            return {**state, "error": result["error"], "status": "fixing"}
    except Exception as e:
        print(f"[ERROR] Compilation exception: {e}")
        return {**state, "error": str(e), "status": "fixing"}


def fix_node(state: LatexAgentState) -> LatexAgentState:
    """Enhanced fix node with exponential backoff and intelligent recovery."""
    retry_count = state["retries"]

    # Exponential backoff delay (but cap it reasonably)
    if retry_count > 0:
        delay = min(math.pow(1.5, retry_count - 1), 10)  # Max 10 seconds
        print(f"[INFO] Applying exponential backoff: {delay:.1f}s delay")
        time.sleep(delay)

    print(f"[INFO] Attempting fix #{retry_count + 1}...")

    try:
        # Enhanced error context for better fixes
        error_context = (
            f"ATTEMPT #{retry_count + 1} OF MAXIMUM RETRIES\n"
            f"PREVIOUS ERROR: {state['error']}\n\n"
            f"LATEX CODE TO FIX:\n{state['latex']}\n\n"
            f"INSTRUCTIONS: Fix the specific error above. "
            f"If this is a package issue, add missing packages. "
            f"If this is a syntax error, fix the syntax. "
            f"If this is an encoding issue, replace problematic characters."
        )

        response = _llm.invoke(
            [
                SystemMessage(content=_FIX_SYSTEM),
                HumanMessage(content=error_context),
            ]
        )

        fixed_latex = _clean(str(response.content))

        # Verify the fix actually changed something
        if fixed_latex == state["latex"]:
            print(f"[WARN] Fix didn't change the code - applying fallback fixes")
            # Apply some common fallback fixes
            fixed_latex = _apply_fallback_fixes(state["latex"], state["error"])

        print(f"[SUCCESS] Applied fix #{retry_count + 1}")
        return {
            **state,
            "latex": fixed_latex,
            "retries": retry_count + 1,
            "status": "compiling",
        }

    except Exception as e:
        print(f"[ERROR] Fix generation failed: {e}")
        return {
            **state,
            "error": f"Fix generation failed: {e}",
            "retries": retry_count + 1,
            "status": "compiling",
        }


def _apply_fallback_fixes(latex_code: str, error: str) -> str:
    """Apply common fallback fixes when LLM doesn't change the code."""
    fixed = latex_code

    # Common fixes based on error patterns
    if "Package inputenc Error" in error:
        # Replace common problematic characters
        fixes = {""": "``", """: "''", "'": "`", "'": "'", "–": "--", "—": "---"}
        for old, new in fixes.items():
            fixed = fixed.replace(old, new)

    if "ecrm1000.tfm" in error or "font" in error.lower():
        # Remove T1 fontenc
        fixed = re.sub(r"\\usepackage\s*\[\s*T1\s*\]\s*\{\s*fontenc\s*\}", "", fixed)

    if "undefined" in error.lower() and "tikz" in error.lower():
        # Add tikz package if missing
        if "\\usepackage{tikz}" not in fixed:
            fixed = re.sub(r"(\\documentclass.*?})", r"\1\n\\usepackage{tikz}", fixed)

    return fixed
