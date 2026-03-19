import os
from celery import Celery

REDIS_URL = os.getenv("UPSTASH_REDIS_REST_URL", "").replace("https://", "redis://")
REDIS_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")

celery_app = Celery(
    "latexvv",
    broker=f"{REDIS_URL}?authorization={REDIS_TOKEN}",
    backend=f"{REDIS_URL}?authorization={REDIS_TOKEN}",
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    result_expires=3600,
)
