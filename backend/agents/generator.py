from services.llm_service import generate_latex
def generate_document(prompt: str) ->str:
    if not prompt:
        raise ValueError("Prompt cannot be empty")
    latex_output = generate_latex(prompt)

    return latex_output