import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

UPSTASH_HOST = os.getenv("UPSTASH_REDIS_HOST", "")
UPSTASH_PORT = os.getenv("UPSTASH_REDIS_PORT", "6379")
UPSTASH_PASSWORD = os.getenv("UPSTASH_REDIS_PASSWORD", "")

broker_url = (
    f"rediss://:{UPSTASH_PASSWORD}@{UPSTASH_HOST}:{UPSTASH_PORT}?ssl_cert_reqs=required"
)
result_backend = (
    f"rediss://:{UPSTASH_PASSWORD}@{UPSTASH_HOST}:{UPSTASH_PORT}?ssl_cert_reqs=required"
)

celery_app = Celery("latexvv", broker=broker_url, backend=result_backend)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    result_expires=3600,
    broker_connection_retry_on_startup=True,
)
