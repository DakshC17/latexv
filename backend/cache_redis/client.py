import os
from upstash_redis import Redis
from dotenv import load_dotenv

load_dotenv()

_redis: Redis | None = None


def get_redis() -> Redis:
    global _redis
    if _redis is None:
        url = os.getenv("UPSTASH_REDIS_REST_URL")
        token = os.getenv("UPSTASH_REDIS_REST_TOKEN")
        if not url or not token:
            raise ValueError(
                "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set"
            )
        _redis = Redis(url=url, token=token)
    return _redis
