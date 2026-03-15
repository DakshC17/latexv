from services.llm_service import generate_latex



def clean_latex_output(text: str) -> str:

    text = text.replace("```latex", "")
    text = text.replace("```", "")
    text = text.strip()

    return text


def generate_document(prompt: str) ->str:
    if not prompt:
        raise ValueError("Prompt cannot be empty")
    latex_output = generate_latex(prompt)
    cleaned_latex = clean_latex_output(latex_output)

    
    return cleaned_latex
