from typing import Optional
from supabase import Client

from db.client import get_supabase


TABLE_NAME = "users"


def create_user(email: str, password_hash: str) -> dict:
    supabase: Client = get_supabase()
    return (
        supabase.table(TABLE_NAME)
        .insert({"email": email, "password_hash": password_hash})
        .execute()
        .data[0]
    )


def get_user_by_email(email: str) -> Optional[dict]:
    supabase: Client = get_supabase()
    result = supabase.table(TABLE_NAME).select("*").eq("email", email).execute()
    return result.data[0] if result.data else None


def get_user_by_id(user_id: str) -> Optional[dict]:
    supabase: Client = get_supabase()
    result = supabase.table(TABLE_NAME).select("*").eq("id", user_id).execute()
    return result.data[0] if result.data else None
