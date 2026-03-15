from fastapi import APIRouter
from fastapi import HTTPException
from models.compile_models import CompileRequest, CompileResponse
from models.generate_models import GenerateRequest,GenerateResponse
from agents.generator import generate_document
from fastapi.responses import FileResponse
from tools.compiler import compile_latex, LatexCompilationError

router = APIRouter()

@router.get("/")
def health_check():
    return {"Status":"Running"}

@router.post("/generate", response_model=GenerateResponse)
async def generate_request(data:GenerateRequest):

    prompt = data.prompt
    latex_output = generate_document(prompt)
    return GenerateResponse(latex=latex_output)


@router.post("/compile")
async def compile_document(data: CompileRequest):

    latex_code = data.latex
    try:
        pdf_path = compile_latex(latex_code)
    except LatexCompilationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return FileResponse(
        path=pdf_path,
        filename="document.pdf",
        media_type="application/pdf"
    )