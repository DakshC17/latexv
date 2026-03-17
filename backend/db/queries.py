from typing import List, Optional
from supabase import Client

from db.client import get_supabase
from db.models import Document, DocumentCreate, DocumentUpdate


TABLE_NAME = "documents"


def create_document(data: DocumentCreate) -> dict:
    supabase: Client = get_supabase()
    return supabase.table(TABLE_NAME).insert(data.model_dump()).execute().data[0]


def get_document(doc_id: str) -> Optional[dict]:
    supabase: Client = get_supabase()
    result = supabase.table(TABLE_NAME).select("*").eq("id", doc_id).execute()
    return result.data[0] if result.data else None


def list_user_documents(user_id: str) -> List[dict]:
    supabase: Client = get_supabase()
    return (
        supabase.table(TABLE_NAME)
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )


def update_document(doc_id: str, data: DocumentUpdate) -> Optional[dict]:
    supabase: Client = get_supabase()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        return get_document(doc_id)
    result = supabase.table(TABLE_NAME).update(update_data).eq("id", doc_id).execute()
    return result.data[0] if result.data else None


def delete_document(doc_id: str) -> bool:
    supabase: Client = get_supabase()
    result = supabase.table(TABLE_NAME).delete().eq("id", doc_id).execute()
    return len(result.data) > 0
