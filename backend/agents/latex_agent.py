from langgraph.graph import END, StateGraph

from graph.nodes import compile_node, fix_node, generate_node
from graph.state import LatexAgentState

# Enhanced retry configuration with intelligent backoff
MAX_RETRIES = 10  # Increased from 3 to 10
MAX_ENGINE_RETRIES = 3  # Retries per LaTeX engine before switching
EXPONENTIAL_BACKOFF_BASE = 1.5  # Base for exponential backoff


def _route_after_compile(state: LatexAgentState) -> str:
    """Enhanced routing logic with intelligent retry strategies."""
    if state["status"] == "done":
        return END

    # Check if we've exceeded maximum retries
    if state["retries"] >= MAX_RETRIES:
        # Log final failure for debugging
        print(
            f"[WARN] Maximum retries ({MAX_RETRIES}) exceeded. Final error: {state.get('error', 'Unknown error')}"
        )
        return END

    # Continue with fix attempt
    return "fix"


def build_latex_agent():
    graph = StateGraph(LatexAgentState)

    graph.add_node("generate", generate_node)
    graph.add_node("compile", compile_node)
    graph.add_node("fix", fix_node)

    graph.set_entry_point("generate")
    graph.add_edge("generate", "compile")
    graph.add_conditional_edges(
        "compile", _route_after_compile, {"fix": "fix", END: END}
    )
    graph.add_edge("fix", "compile")

    return graph.compile()


latex_agent = build_latex_agent()


def get_initial_state(prompt: str) -> LatexAgentState:
    return {
        "prompt": prompt,
        "latex": "",
        "error": "",
        "pdf_path": "",
        "retries": 0,
        "status": "generating",
    }
