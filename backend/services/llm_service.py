import os 
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

def generate_latex(prompt : str) -> str:
    system_prompt = f"""
        You are a LaTeX generator.

    Convert the following instruction into valid LaTeX code.

    Rules:
    - Return ONLY LaTeX code
    - Do not include explanations
    - Ensure valid LaTeX syntax
    - Ensure environments close properly

    Instruction:
    {prompt}
    """

    response = model.generate_content(system_prompt)
    return response.text