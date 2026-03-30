from typing import List, Optional
from supabase import Client

from db.client import get_supabase
from db.models import (
    Document,
    DocumentCreate,
    DocumentUpdate,
    Conversation,
    ConversationCreate,
    WaitlistCreate,
    WaitlistUpdate,
)


TABLE_NAME = "documents"
CONVERSATIONS_TABLE = "conversations"
WAITLIST_TABLE = "waitlist"


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


def create_conversation(data: ConversationCreate) -> dict:
    supabase: Client = get_supabase()
    return (
        supabase.table(CONVERSATIONS_TABLE).insert(data.model_dump()).execute().data[0]
    )


def get_conversation(conv_id: str) -> Optional[dict]:
    supabase: Client = get_supabase()
    result = supabase.table(CONVERSATIONS_TABLE).select("*").eq("id", conv_id).execute()
    return result.data[0] if result.data else None


def list_user_conversations(user_id: str) -> List[dict]:
    supabase: Client = get_supabase()
    return (
        supabase.table(CONVERSATIONS_TABLE)
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
        .data
    )


def update_conversation(conv_id: str, data: dict) -> Optional[dict]:
    supabase: Client = get_supabase()
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data:
        return get_conversation(conv_id)
    update_data["updated_at"] = "now()"
    result = (
        supabase.table(CONVERSATIONS_TABLE)
        .update(update_data)
        .eq("id", conv_id)
        .execute()
    )
    return result.data[0] if result.data else None


def delete_conversation(conv_id: str) -> bool:
    supabase: Client = get_supabase()
    result = supabase.table(CONVERSATIONS_TABLE).delete().eq("id", conv_id).execute()
    return len(result.data) > 0


# Waitlist functions
def add_to_waitlist(data: WaitlistCreate) -> dict:
    """Add email to waitlist. Returns the created entry or existing entry if duplicate."""
    supabase: Client = get_supabase()
    try:
        # Try to insert new entry
        result = supabase.table(WAITLIST_TABLE).insert(data.model_dump()).execute()
        return result.data[0]
    except Exception as e:
        # Handle duplicate email case
        if "duplicate key value" in str(e) or "violates unique constraint" in str(e):
            # Return existing entry
            result = (
                supabase.table(WAITLIST_TABLE)
                .select("*")
                .eq("email", data.email)
                .execute()
            )
            if result.data:
                return result.data[0]
        raise e


def get_waitlist_entry(email: str) -> Optional[dict]:
    """Get waitlist entry by email."""
    supabase: Client = get_supabase()
    result = supabase.table(WAITLIST_TABLE).select("*").eq("email", email).execute()
    return result.data[0] if result.data else None


def list_waitlist_entries(limit: Optional[int] = None, offset: int = 0) -> List[dict]:
    """List all waitlist entries, ordered by creation date (newest first)."""
    supabase: Client = get_supabase()
    query = supabase.table(WAITLIST_TABLE).select("*").order("created_at", desc=True)

    if limit:
        query = query.range(offset, offset + limit - 1)

    return query.execute().data


def update_waitlist_entry(email: str, data: WaitlistUpdate) -> Optional[dict]:
    """Update waitlist entry status."""
    supabase: Client = get_supabase()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        return get_waitlist_entry(email)

    result = (
        supabase.table(WAITLIST_TABLE).update(update_data).eq("email", email).execute()
    )
    return result.data[0] if result.data else None


def get_waitlist_stats() -> dict:
    """Get waitlist statistics."""
    supabase: Client = get_supabase()

    # Total count
    total_result = supabase.table(WAITLIST_TABLE).select("id", count="exact").execute()
    total_count = total_result.count

    # Active count
    active_result = (
        supabase.table(WAITLIST_TABLE)
        .select("id", count="exact")
        .eq("status", "active")
        .execute()
    )
    active_count = active_result.count

    return {
        "total": total_count,
        "active": active_count,
        "converted": total_count - active_count if total_count else 0,
    }
