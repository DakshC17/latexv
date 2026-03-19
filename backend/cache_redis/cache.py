import hashlib
from cache_redis.client import get_redis

CACHE_TTL_SECONDS = 3600


def _latex_hash(latex: str) -> str:
    return hashlib.sha256(latex.encode()).hexdigest()[:16]


def cache_pdf(doc_id: str, latex: str, pdf_path: str) -> None:
    redis = get_redis()
    key = f"pdf:{doc_id}"
    redis.setex(key, CACHE_TTL_SECONDS, pdf_path)


def get_cached_pdf(doc_id: str) -> str | None:
    redis = get_redis()
    key = f"pdf:{doc_id}"
    return redis.get(key)


def invalidate_pdf_cache(doc_id: str) -> None:
    redis = get_redis()
    key = f"pdf:{doc_id}"
    redis.delete(key)


def cache_latex_result(latex: str, result: str) -> None:
    redis = get_redis()
    key = f"latex:{_latex_hash(latex)}"
    redis.setex(key, CACHE_TTL_SECONDS, result)


def get_cached_latex_result(latex: str) -> str | None:
    redis = get_redis()
    key = f"latex:{_latex_hash(latex)}"
    return redis.get(key)
