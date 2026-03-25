from fastapi import APIRouter, HTTPException, Request, Response, status

from auth.models import UserCreate, UserLogin, UserResponse
from auth import session as session_manager
from auth import utils as auth_utils
from db import users as user_queries

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, response: Response):
    existing = user_queries.get_user_by_email(data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    password_hash = auth_utils.hash_password(data.password)
    user = user_queries.create_user(data.email, password_hash)

    session_id = session_manager.create_session(user["id"])
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=86400,
    )

    return UserResponse(
        id=user["id"],
        email=user["email"],
        role=user["role"],
        created_at=user.get("created_at"),
    )


@router.post("/login")
async def login(data: UserLogin, response: Response):
    user = user_queries.get_user_by_email(data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not auth_utils.verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_id = session_manager.create_session(user["id"])
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=86400,
    )

    return UserResponse(
        id=user["id"],
        email=user["email"],
        role=user["role"],
        created_at=user.get("created_at"),
    )


@router.post("/logout")
async def logout(request: Request, response: Response):
    session_id = request.cookies.get("session_id")
    if session_id:
        session_manager.delete_session(session_id)
    response.delete_cookie(key="session_id")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def me(request: Request):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = session_manager.get_session(session_id)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired")

    user = user_queries.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=user["id"],
        email=user["email"],
        role=user["role"],
        created_at=user.get("created_at"),
    )
