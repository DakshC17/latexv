import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_supabase_client: Client | None = None

BUCKET_NAME = "pdfs"


def get_supabase_storage() -> Client:
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        _supabase_client = create_client(url, key)
    return _supabase_client


def upload_pdf(local_path: str, user_id: str, doc_id: str) -> str:
    supabase = get_supabase_storage()

    file_name = f"{user_id}/{doc_id}/{uuid.uuid4()}.pdf"

    with open(local_path, "rb") as f:
        supabase.storage.from_(BUCKET_NAME).upload(
            file_name,
            f.read(),
            {"content-type": "application/pdf"},
        )

    return supabase.storage.from_(BUCKET_NAME).get_public_url(file_name)


def delete_pdf(storage_url: str) -> bool:
    supabase = get_supabase_storage()

    path = storage_url.split(f"/{BUCKET_NAME}/")[-1]
    if not path:
        return False

    supabase.storage.from_(BUCKET_NAME).remove(path)
    return True
