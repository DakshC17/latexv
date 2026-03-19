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

_GENERATE_SYSTEM = """You are a LaTeX document generator.
Return ONLY valid, compilable LaTeX code — no explanations, no markdown fences.
Always include \\documentclass, \\begin{{document}}, and \\end{{document}}.

CRITICAL RULES:
1. Use ONLY these packages: inputenc, fontenc, lmodern, geometry, enumitem, ragged2e
2. NO special characters in section titles (avoid %, &, #, $, {, } directly)
3. For special symbols, use \\textbf{{text}} not \\textbf text
4. Simple itemize environments only, no nested itemize deeper than 2 levels
5. NO titlesec, NO hyperref, NO complex formatting
6. Keep it SIMPLE and COMPILABLE

BAD EXAMPLE: \\section{About Me} \\textbf{Hello}
GOOD EXAMPLE: \\section*{About} Hello"""

_FIX_SYSTEM = """You are a LaTeX error fixer.
You will receive a LaTeX document and a pdflatex error log.
Return ONLY the corrected LaTeX code — no explanations, no markdown fences.

CRITICAL RULES:
1. Use ONLY these packages: inputenc, fontenc, lmodern, geometry, enumitem, ragged2e
2. NO special characters in section titles
3. Simple, clean LaTeX only
4. Remove ANY problematic code causing the error
5. Keep it minimal and compilable"""


def _clean(text: str) -> str:
    return re.sub(
        r"^```(?:latex)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE
    ).strip()


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
