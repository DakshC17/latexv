import asyncio
import json
import uuid
from fastapi import APIRouter, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, StreamingResponse

from agents.generator import generate_document
from agents.latex_agent import latex_agent, get_initial_state
from db.models import Document, DocumentCreate, DocumentUpdate, ConversationCreate
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


async def agent_stream(prompt: str, user_id: str, conversation_history: list = []):
    doc_id = str(uuid.uuid4())
    from graph.nodes import _llm, _GENERATE_SYSTEM, _FIX_SYSTEM, _clean
    from langchain_core.messages import HumanMessage, SystemMessage
    from tools.latex_tools import compile_latex_tool

    initial_state = get_initial_state(prompt)
    latex = ""
    retries = 0
    max_retries = 3
    conv_id = None
    pdf_url = None

    try:
        conv_data = ConversationCreate(
            user_id=user_id, prompt=prompt, status="in_progress"
        )
        conv = db_queries.create_conversation(conv_data)
        conv_id = conv["id"]

        state = {
            **initial_state,
            "latex": "",
            "status": "planning",
            "error": "",
            "pdf_path": "",
            "retries": 0,
            "conversation_id": conv_id,
            "message": "Analyzing request and planning document structure...",
        }
        yield f"data: {json.dumps(state)}\n\n"

        # Build messages with conversation history
        messages = [SystemMessage(content=_GENERATE_SYSTEM)]

        # Add conversation history
        if conversation_history:
            history_context = "\n\nPrevious conversation:\n"
            for msg in conversation_history[-5:]:  # Last 5 messages for context
                role = "User" if msg.role == "user" else "Assistant"
                history_context += f"\n{role}: {msg.content[:200]}"

            prompt_with_context = f"{history_context}\n\nNew request: {prompt}"
        else:
            prompt_with_context = f"Create a LaTeX document for: {prompt}"

        messages.append(HumanMessage(content=prompt_with_context))

        async for chunk in _llm.astream(messages):
            if hasattr(chunk, "content") and chunk.content:
                content_val = chunk.content
                chunk_text = ""
                if isinstance(content_val, list):
                    for item in content_val:
                        if isinstance(item, str):
                            chunk_text += item
                        elif isinstance(item, dict) and "text" in item:
                            chunk_text += str(item["text"])
                        else:
                            chunk_text += str(item)
                else:
                    chunk_text = str(content_val)

                latex = latex + chunk_text
                state = {
                    **initial_state,
                    "latex": latex,
                    "status": "generating",
                    "error": "",
                    "pdf_path": "",
                    "retries": retries,
                    "conversation_id": conv_id,
                    "message": "Generating LaTeX code...",
                }
                yield f"data: {json.dumps(state)}\n\n"

        final_latex = _clean(latex)

        # Compile with self-correction loop
        while retries <= max_retries:
            state = {
                **initial_state,
                "latex": final_latex,
                "status": "compiling",
                "error": "",
                "pdf_path": "",
                "retries": retries,
                "conversation_id": conv_id,
                "message": f"Compiling PDF (attempt {retries + 1}/{max_retries + 1})..."
                if retries > 0
                else "Compiling PDF...",
            }
            yield f"data: {json.dumps(state)}\n\n"

            result = compile_latex_tool.invoke({"latex": final_latex})

            if result["success"]:
                pdf_path = result["pdf_path"]
                try:
                    pdf_url = upload_pdf(
                        local_path=pdf_path,
                        user_id=user_id,
                        doc_id=doc_id,
                    )
                    final_state = {
                        **state,
                        "pdf_path": pdf_path,
                        "pdf_url": pdf_url,
                        "status": "done",
                        "message": "Document compiled successfully!",
                    }
                except Exception as e:
                    pdf_url = None
                    final_state = {
                        **state,
                        "pdf_path": pdf_path,
                        "upload_error": str(e),
                        "status": "done",
                        "message": "Document compiled (upload warning)",
                    }
                if conv_id:
                    db_queries.update_conversation(
                        conv_id,
                        {
                            "latex": final_latex,
                            "pdf_url": pdf_url,
                            "status": "completed",
                        },
                    )
                yield f"data: {json.dumps(final_state)}\n\n"
                return

            # Compilation failed - auto-fix
            error_msg = result.get("error", "Unknown error")
            retries += 1

            if retries > max_retries:
                error_state = {
                    **state,
                    "error": f"Failed after {max_retries} attempts. Last error: {error_msg}",
                    "status": "failed",
                    "message": f"Failed after {max_retries} auto-correction attempts",
                }
                if conv_id:
                    db_queries.update_conversation(
                        conv_id, {"latex": final_latex, "status": "failed"}
                    )
                yield f"data: {json.dumps(error_state)}\n\n"
                return

            # Fix the LaTeX
            state["status"] = "fixing"
            state["message"] = f"Self-correcting (attempt {retries}/{max_retries})..."
            yield f"data: {json.dumps(state)}\n\n"

            fix_messages = [
                SystemMessage(content=_FIX_SYSTEM),
                HumanMessage(content=f"LaTeX:\n{final_latex}\n\nError:\n{error_msg}"),
            ]

            fixed_latex = ""
            async for chunk in _llm.astream(fix_messages):
                if hasattr(chunk, "content") and chunk.content:
                    content_val = chunk.content
                    chunk_text = ""
                    if isinstance(content_val, list):
                        for item in content_val:
                            if isinstance(item, str):
                                chunk_text += item
                            elif isinstance(item, dict) and "text" in item:
                                chunk_text += str(item["text"])
                            else:
                                chunk_text += str(item)
                    else:
                        chunk_text = str(content_val)

                    fixed_latex += chunk_text
                    state = {
                        **state,
                        "latex": fixed_latex,
                        "retries": retries,
                        "message": f"Fixing error and regenerating (attempt {retries}/{max_retries})...",
                    }
                    yield f"data: {json.dumps(state)}\n\n"

    except Exception as e:
        error_state = {
            **initial_state,
            "error": str(e),
            "status": "failed",
            "message": "Generation failed",
        }
        yield f"data: {json.dumps(error_state)}\n\n"


@router.post("/v2/agent/stream")
async def agent_stream_endpoint(request: Request, data: GenerateRequest):
    client_id = _get_client_id(request)
    if redis_rate.is_rate_limited(client_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    return StreamingResponse(
        agent_stream(
            data.prompt,
            user_id=request.state.user_id,
            conversation_history=data.conversation_history or [],
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.get("/conversations")
async def list_conversations(request: Request):
    return db_queries.list_user_conversations(request.state.user_id)


@router.get("/conversations/{conv_id}")
async def get_conversation(conv_id: str, request: Request):
    conv = db_queries.get_conversation(conv_id)
    if not conv or conv["user_id"] != request.state.user_id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str, request: Request):
    conv = db_queries.get_conversation(conv_id)
    if not conv or conv["user_id"] != request.state.user_id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db_queries.delete_conversation(conv_id)
    return {"message": "Conversation deleted"}
