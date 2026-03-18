from fastapi import FastAPI

from api.routes import router
from auth.routes import router as auth_router
from middleware.auth import AuthMiddleware

app = FastAPI()

app.add_middleware(AuthMiddleware)

app.include_router(auth_router)
app.include_router(router)
