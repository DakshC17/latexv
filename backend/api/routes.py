import json
import uuid
from fastapi import APIRouter, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, StreamingResponse

from agents.generator import generate_document
from agents.latex_agent import latex_agent, get_initial_state
from db.models import Document, DocumentCreate, DocumentUpdate
from db import queries as db_queries
from db import versions as version_queries
from models.compile_models import CompileRequest
from models.generate_models import GenerateRequest, GenerateResponse
from cache_redis import cache as redis_cache
from cache_redis import rate_limiter as redis_rate
from services.storage import upload_pdf
from tasks.compile import compile_document_task
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

    initial_state = get_initial_state(data.prompt)
    result = await run_in_threadpool(latex_agent.invoke, initial_state)

    if result["status"] == "done":
        try:
            doc_id = str(uuid.uuid4())
            pdf_url = upload_pdf(
                local_path=result["pdf_path"],
                user_id=request.state.user_id,
                doc_id=doc_id,
            )
            redis_cache.cache_latex_result(data.prompt, result["pdf_path"])
            return {"pdf_url": pdf_url, "latex": result["latex"]}
        except Exception as exc:
            raise HTTPException(
                status_code=500, detail=f"PDF upload failed: {str(exc)}"
            )

    raise HTTPException(
        status_code=422,
        detail={
            "error": result["error"],
            "last_latex": result["latex"],
            "attempts": result["retries"],
        },
    )


@router.post("/v2/agent/async")
async def agent_async(request: Request, data: GenerateRequest):
    """Submit document generation as background job. Returns job_id for polling."""
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    doc = db_queries.create_document(
        DocumentCreate(
            user_id=request.state.user_id,
            prompt=data.prompt,
            latex="",
            status="processing",
        )
    )

    task = compile_document_task.delay(
        prompt=data.prompt,
        document_id=doc["id"],
        user_id=request.state.user_id,
    )

    return {
        "job_id": task.id,
        "document_id": doc["id"],
        "status": "pending",
    }


@router.get("/status/{job_id}")
async def get_job_status(request: Request, job_id: str):
    """Poll for job status and result."""
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    from tasks.celery_app import celery_app

    result = celery_app.AsyncResult(job_id)

    response = {
        "job_id": job_id,
        "status": result.state.lower() if result.state else "unknown",
    }

    if result.state == "SUCCESS":
        response.update(result.result)
    elif result.state == "FAILURE":
        response["error"] = str(result.info)
    elif result.state == "PROGRESS":
        response["meta"] = result.info

    return response


@router.post("/documents", response_model=Document)
async def create_document(request: Request, data: DocumentCreate):
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    data.user_id = request.state.user_id
    return db_queries.create_document(data)


@router.get("/documents/{doc_id}", response_model=Document)
async def get_document(request: Request, doc_id: str):
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    doc = db_queries.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.get("user_id") != request.state.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return doc


@router.get("/documents", response_model=list[Document])
async def list_documents(request: Request):
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    return db_queries.list_user_documents(request.state.user_id)


@router.put("/documents/{doc_id}", response_model=Document)
async def update_document(request: Request, doc_id: str, data: DocumentUpdate):
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    doc = db_queries.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.get("user_id") != request.state.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return db_queries.update_document(doc_id, data)


@router.delete("/documents/{doc_id}")
async def delete_document(request: Request, doc_id: str):
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    doc = db_queries.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.get("user_id") != request.state.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    success = db_queries.delete_document(doc_id)
    return {"deleted": True}


@router.get("/documents/{doc_id}/versions")
async def get_document_versions(request: Request, doc_id: str):
    """Get all versions of a document."""
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    doc = db_queries.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.get("user_id") != request.state.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return version_queries.get_versions(doc_id)


@router.get("/documents/{doc_id}/versions/{version_id}")
async def get_version(request: Request, doc_id: str, version_id: str):
    """Get a specific version of a document."""
    if redis_rate.is_rate_limited(_get_client_id(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    doc = db_queries.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.get("user_id") != request.state.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    version = version_queries.get_version(version_id)
    if not version or version["document_id"] != doc_id:
        raise HTTPException(status_code=404, detail="Version not found")
    return version


async def agent_stream(prompt: str, user_id: str):
    doc_id = str(uuid.uuid4())
    initial_state = get_initial_state(prompt)

    final_result = None

    async for event in latex_agent.astream_events(initial_state, version="v2"):
        event_type = event.get("event", "")
        if event_type == "on_chain_stream":
            node_name = event.get("name", "unknown")
            data = event.get("data", {})
            if "output" in data:
                output = data["output"]
                if isinstance(output, dict):
                    final_result = output
                yield f"data: {json.dumps(output)}\n\n"
        elif event_type == "on_chain_end":
            final_state = event.get("data", {}).get("output", {})
            final_result = final_state

    if (
        final_result
        and final_result.get("status") == "done"
        and final_result.get("pdf_path")
    ):
        try:
            pdf_url = upload_pdf(
                local_path=final_result["pdf_path"],
                user_id=user_id,
                doc_id=doc_id,
            )
            final_result["pdf_url"] = pdf_url
            yield f"data: {json.dumps(final_result)}\n\n"
        except Exception as e:
            final_result["upload_error"] = str(e)
            yield f"data: {json.dumps(final_result)}\n\n"


@router.post("/v2/agent/stream")
async def agent_stream_endpoint(request: Request, data: GenerateRequest):
    client_id = _get_client_id(request)
    if redis_rate.is_rate_limited(client_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    return StreamingResponse(
        agent_stream(data.prompt, user_id=request.state.user_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
