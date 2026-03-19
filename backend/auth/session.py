import secrets
from datetime import datetime, timezone
from typing import Optional

from cache_redis.client import get_redis

SESSION_TTL_SECONDS = 86400


def create_session(user_id: str) -> str:
    redis = get_redis()
    session_id = secrets.token_urlsafe(32)
    session_data = f"{user_id}:{datetime.now(timezone.utc).isoformat()}"
    redis.setex(f"session:{session_id}", SESSION_TTL_SECONDS, session_data)
    return session_id


def get_session(session_id: str) -> Optional[str]:
    redis = get_redis()
    data = redis.get(f"session:{session_id}")
    if not data:
        return None
    return data.split(":")[0]


def delete_session(session_id: str) -> None:
    redis = get_redis()
    redis.delete(f"session:{session_id}")
