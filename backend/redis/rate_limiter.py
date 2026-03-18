from redis.client import get_redis

DEFAULT_LIMIT = 60
DEFAULT_WINDOW = 60


def is_rate_limited(
    identifier: str, limit: int = DEFAULT_LIMIT, window: int = DEFAULT_WINDOW
) -> bool:
    redis = get_redis()
    key = f"ratelimit:{identifier}"
    current = redis.get(key)

    if current is None:
        redis.setex(key, window, "1")
        return False

    count = int(current)
    if count >= limit:
        return True

    redis.incr(key)
    return False


def get_remaining_requests(identifier: str, limit: int = DEFAULT_LIMIT) -> int:
    redis = get_redis()
    key = f"ratelimit:{identifier}"
    current = redis.get(key)
    if current is None:
        return limit
    return max(0, limit - int(current))
