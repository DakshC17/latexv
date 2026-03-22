import os
import re

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

_GENERATE_SYSTEM = (
    "You are a LaTeX document generator with conversation memory.\n"
    "Return ONLY valid, compilable LaTeX code — no explanations, no markdown fences.\n"
    "Always include \\documentclass, \\begin{document}, and \\end{document}.\n\n"
    "ALLOWED PACKAGES (you can use ALL of these):\n"
    "inputenc, fontenc, lmodern, geometry, enumitem, ragged2e, amsmath, amssymb, amsfonts,\n"
    "bm, graphicx, tabularx, booktabs, caption, subcaption, TikZ, xcolor, microtype,\n"
    "setspace, fancyhdr, babel, input, ifthen, calc, textcomp, marvosym, wasysym,\n"
    "pifont, dingbat, lipsum, blindtext, multirow, hhline, array, longtable,\n"
    "hyperref, url, pdfpages, geometry, changepage, indentfirst, paralist,\n"
    "verbatim, listings, color, latexsym, mathrsfs, esint, accents\n\n"
    "CRITICAL RULES - STRICTLY FOLLOW:\n"
    "1. For text formatting use: \\textbf{text}, \\textit{text}, \\underline{text}, \\texttt{text}\n"
    "2. For lists use: itemize or enumerate (max 2 levels deep)\n"
    "3. For math use: equation, align, gather environments with amsmath\n"
    "4. For tables use: tabular with booktabs rules (\\toprule, \\midrule, \\bottomrule)\n"
    "5. For images use: \\includegraphics[width=X\\textwidth]{filename}\n"
    "6. Special characters in text: use \\%, \\&, \\#, \\$, \\{, \\}\n"
    "7. NEVER use \\justify or \\Justifying - use \\raggedright or \\centering instead\n"
    "8. Keep it COMPILABLE and clean\n"
    "9. You can reference and build upon previous documents in the conversation history\n"
    "10. When editing existing code, only modify what is requested - do not rewrite entire document\n\n"
    "COMMON PATTERNS:\n"
    "\\documentclass[11pt]{article}\n"
    "\\usepackage[utf8]{inputenc}\n"
    "\\usepackage{amsmath, amssymb}\n"
    "\\begin{document}\n"
    "\\section{Title}\n"
    "Content here.\n"
    "\\end{document}"
)

_FIX_SYSTEM = (
    "You are a LaTeX error fixer.\n"
    "You will receive a LaTeX document and a pdflatex error log.\n"
    "Return ONLY the corrected LaTeX code — no explanations, no markdown fences.\n\n"
    "CRITICAL RULES - STRICTLY FOLLOW:\n"
    "1. Use these allowed packages: inputenc, fontenc, lmodern, geometry, enumitem, ragged2e, amsmath, amssymb, amsfonts, bm, graphicx, tabularx, booktabs, caption\n"
    "2. For text formatting: \\textbf{text}, \\textit{text}, \\underline{text}\n"
    "3. Simple itemize/enumerate only (max 2 levels)\n"
    "4. Simple, clean LaTeX only\n"
    "5. Remove ANY problematic code causing the error\n"
    "6. Keep it minimal and compilable\n"
    "7. If error mentions undefined sequence, check for missing backslashes\n"
    "8. Replace \\justify or \\Justifying with \\raggedright\n"
    "9. DO NOT introduce new commands - only fix the error and keep everything else exactly as is\n"
    "10. Check for balanced braces {}, brackets [], and parentheses"
)


def _clean(text: str) -> str:
    cleaned = re.sub(
        r"^```(?:latex)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE
    ).strip()

    cleaned = re.sub(r"\\justify\b", "", cleaned)
    cleaned = re.sub(r"\\Justifying\b", "", cleaned)
    cleaned = re.sub(r"\bJustifying\b", "", cleaned)

    cleaned = re.sub(r"\n\n\n+", "\n\n", cleaned)
    cleaned = re.sub(r"[ \t]+\n", "\n", cleaned)

    return cleaned.strip()


def generate_node(state: LatexAgentState) -> LatexAgentState:
    response = _llm.invoke(
        [
            SystemMessage(content=_GENERATE_SYSTEM),
            HumanMessage(content=state["prompt"]),
        ]
    )
    latex = _clean(str(response.content))
    return {**state, "latex": latex, "status": "compiling"}


def compile_node(state: LatexAgentState) -> LatexAgentState:
    result = compile_latex_tool.invoke({"latex": state["latex"]})
    if result["success"]:
        return {**state, "pdf_path": result["pdf_path"], "error": "", "status": "done"}
    return {**state, "error": result["error"], "status": "fixing"}


def fix_node(state: LatexAgentState) -> LatexAgentState:
    response = _llm.invoke(
        [
            SystemMessage(content=_FIX_SYSTEM),
            HumanMessage(
                content=f"LaTeX:\n{state['latex']}\n\nError:\n{state['error']}"
            ),
        ]
    )
    return {
        **state,
        "latex": _clean(str(response.content)),
        "retries": state["retries"] + 1,
        "status": "compiling",
    }
