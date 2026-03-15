from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse

from agents.generator import generate_document
from agents.latex_agent import latex_agent
from models.compile_models import CompileRequest
from models.generate_models import GenerateRequest, GenerateResponse
from tools.compiler import LatexCompilationError, compile_latex

router = APIRouter()


@router.get("/")
def health_check():
    return {"Status": "Running"}


@router.post("/generate", response_model=GenerateResponse)
async def generate_request(data: GenerateRequest):
    latex_output = generate_document(data.prompt)
    return GenerateResponse(latex=latex_output)


@router.post("/compile")
async def compile_document(data: CompileRequest):
    try:
        pdf_path = compile_latex(data.latex)
    except LatexCompilationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return FileResponse(
        path=pdf_path, filename="document.pdf", media_type="application/pdf"
    )


@router.post("/v2/agent")
async def agent_generate(data: GenerateRequest):
    initial_state = {
        "prompt": data.prompt,
        "latex": "",
        "error": "",
        "pdf_path": "",
        "retries": 0,
        "status": "generating",
    }
    result = await run_in_threadpool(latex_agent.invoke, initial_state)

    if result["status"] == "done":
        return FileResponse(
            path=result["pdf_path"],
            filename="document.pdf",
            media_type="application/pdf",
        )

    raise HTTPException(
        status_code=422,
        detail={
            "error": result["error"],
            "last_latex": result["latex"],
            "attempts": result["retries"],
        },
    )
