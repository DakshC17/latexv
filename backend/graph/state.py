from typing import TypedDict


class LatexAgentState(TypedDict):
    prompt: str
    latex: str
    error: str
    pdf_path: str
    retries: int
    status: str
