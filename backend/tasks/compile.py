from tasks.celery_app import celery_app
from agents.latex_agent import latex_agent, get_initial_state
from services.storage import upload_pdf
from db import versions as version_queries
from db import queries as doc_queries
from db.models import DocumentUpdate


@celery_app.task(bind=True)
def compile_document_task(self, prompt: str, document_id: str, user_id: str):
    self.update_state(state="GENERATING", meta={"step": "Generating LaTeX..."})

    initial_state = get_initial_state(prompt)
    result = latex_agent.invoke(initial_state)

    if result["status"] == "done":
        self.update_state(state="COMPILING", meta={"step": "Compiling PDF..."})

        pdf_url = upload_pdf(
            local_path=result["pdf_path"],
            user_id=user_id,
            doc_id=document_id,
        )

        latest = version_queries.get_latest_version(document_id)
        version_number = (latest["version_number"] + 1) if latest else 1

        version = version_queries.create_version(
            document_id=document_id,
            version_number=version_number,
            latex=result["latex"],
            pdf_url=pdf_url,
            prompt=prompt,
            status="success",
        )

        doc_queries.update_document(
            document_id,
            DocumentUpdate(
                latex=result["latex"],
                pdf_url=pdf_url,
                status="success",
            ),
        )

        return {
            "status": "done",
            "pdf_url": pdf_url,
            "latex": result["latex"],
            "version_id": version["id"],
            "version_number": version_number,
        }

    doc_queries.update_document(document_id, DocumentUpdate(status="failed"))

    return {
        "status": "failed",
        "error": result.get("error", "Unknown error"),
        "latex": result.get("latex", ""),
        "attempts": result.get("retries", 0),
    }
