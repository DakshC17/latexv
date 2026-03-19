from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from auth.routes import router as auth_router
from middleware.auth import AuthMiddleware

app = FastAPI()

app.add_middleware(AuthMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(router)
