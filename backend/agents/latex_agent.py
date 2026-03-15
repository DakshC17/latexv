from langgraph.graph import END, StateGraph

from graph.nodes import compile_node, fix_node, generate_node
from graph.state import LatexAgentState

MAX_RETRIES = 3


def _route_after_compile(state: LatexAgentState) -> str:
    if state["status"] == "done":
        return END
    if state["retries"] >= MAX_RETRIES:
        return END
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
