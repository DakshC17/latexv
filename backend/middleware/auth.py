from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from auth.session import get_session


PUBLIC_PATHS = [
    "/",
    "/docs",
    "/openapi.json",
    "/redoc",
]


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if path in PUBLIC_PATHS or path in ("/auth/register", "/auth/login"):
            return await call_next(request)

        session_id = request.cookies.get("session_id")
        if not session_id:
            return JSONResponse(
                status_code=401,
                content={"detail": "Not authenticated"},
            )

        user_id = get_session(session_id)
        if not user_id:
            return JSONResponse(
                status_code=401,
                content={"detail": "Session expired"},
            )

        request.state.user_id = user_id
        return await call_next(request)
