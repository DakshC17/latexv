from fastapi import APIRouter, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse

from agents.generator import generate_document
from agents.latex_agent import latex_agent
from db.models import Document, DocumentCreate, DocumentUpdate
from db import queries as db_queries
from models.compile_models import CompileRequest
from models.generate_models import GenerateRequest, GenerateResponse
from redis import cache as redis_cache
from redis import rate_limiter as redis_rate
from tools.compiler import LatexCompilationError, compile_latex

router = APIRouter()


def _get_client_id(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.get("/")
def health_check():
    return {"Status": "Running"}


@router.post("/generate", response_model=GenerateResponse)
async def generate_request(request: Request, data: GenerateRequest):
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    latex_output = generate_document(data.prompt)
    return GenerateResponse(latex=latex_output)


@router.post("/compile")
async def compile_document(request: Request, data: CompileRequest):
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    try:
        pdf_path = compile_latex(data.latex)
    except LatexCompilationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return FileResponse(
        path=pdf_path, filename="document.pdf", media_type="application/pdf"
    )


@router.post("/v2/agent")
async def agent_generate(request: Request, data: GenerateRequest):
    client_id = _get_client_id(request)
    if redis_rate.is_rate_limited(client_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    cached_pdf = redis_cache.get_cached_latex_result(data.prompt)
    if cached_pdf:
        return FileResponse(
            path=cached_pdf,
            filename="document.pdf",
            media_type="application/pdf",
        )

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
        redis_cache.cache_latex_result(data.prompt, result["pdf_path"])
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


@router.post("/documents", response_model=Document)
async def create_document(request: Request, data: DocumentCreate):
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    return db_queries.create_document(data)


@router.get("/documents/{doc_id}", response_model=Document)
async def get_document(request: Request, doc_id: str):
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    doc = db_queries.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/documents", response_model=list[Document])
async def list_documents(request: Request, user_id: str):
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    return db_queries.list_user_documents(user_id)


@router.put("/documents/{doc_id}", response_model=Document)
async def update_document(request: Request, doc_id: str, data: DocumentUpdate):
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    doc = db_queries.update_document(doc_id, data)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/documents/{doc_id}")
async def delete_document(request: Request, doc_id: str):
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    success = db_queries.delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"deleted": True}
