from tasks.compile import compile_document_task
from tasks.celery_app import celery_app

__all__ = ["celery_app", "compile_document_task"]
