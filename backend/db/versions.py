from typing import Optional
from supabase import Client

from db.client import get_supabase

TABLE_NAME = "document_versions"


def create_version(
    document_id: str,
    version_number: int,
    latex: str,
    pdf_url: Optional[str],
    prompt: str,
    status: str = "success",
    error: Optional[str] = None,
) -> dict:
    supabase: Client = get_supabase()
    return (
        supabase.table(TABLE_NAME)
        .insert(
            {
                "document_id": document_id,
                "version_number": version_number,
                "latex": latex,
                "pdf_url": pdf_url,
                "prompt": prompt,
                "status": status,
                "error": error,
            }
        )
        .execute()
        .data[0]
    )


def get_versions(document_id: str) -> list:
    supabase: Client = get_supabase()
    return (
        supabase.table(TABLE_NAME)
        .select("*")
        .eq("document_id", document_id)
        .order("version_number", desc=True)
        .execute()
        .data
    )


def get_latest_version(document_id: str) -> Optional[dict]:
    versions = get_versions(document_id)
    return versions[0] if versions else None


def get_version(version_id: str) -> Optional[dict]:
    supabase: Client = get_supabase()
    result = supabase.table(TABLE_NAME).select("*").eq("id", version_id).execute()
    return result.data[0] if result.data else None
