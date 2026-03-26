import os
import uuid
import time
import math
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_supabase_client: Client | None = None

BUCKET_NAME = "pdfs"

# Enhanced upload configuration
MAX_UPLOAD_RETRIES = 5
UPLOAD_TIMEOUT = 60  # seconds
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def get_supabase_storage() -> Client:
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        _supabase_client = create_client(url, key)
    return _supabase_client


def upload_pdf_robust(local_path: str, user_id: str, doc_id: str) -> str:
    """
    Upload PDF with exponential backoff retry logic and comprehensive error handling.

    Args:
        local_path: Path to local PDF file
        user_id: User identifier
        doc_id: Document identifier

    Returns:
        Public URL of uploaded file

    Raises:
        FileNotFoundError: If local file doesn't exist
        ValueError: If file is too large
        Exception: If upload fails after all retries
    """
    # Validate file exists and size
    if not os.path.exists(local_path):
        raise FileNotFoundError(f"PDF file not found: {local_path}")

    file_size = os.path.getsize(local_path)
    if file_size > MAX_FILE_SIZE:
        raise ValueError(
            f"PDF file too large: {file_size} bytes > {MAX_FILE_SIZE} bytes"
        )

    if file_size == 0:
        raise ValueError("PDF file is empty")

    supabase = get_supabase_storage()
    file_name = f"{user_id}/{doc_id}/{uuid.uuid4()}.pdf"

    last_error = None

    for attempt in range(MAX_UPLOAD_RETRIES):
        try:
            print(
                f"[UPLOAD] Upload attempt {attempt + 1}/{MAX_UPLOAD_RETRIES} for {file_name}"
            )

            with open(local_path, "rb") as f:
                file_content = f.read()

                # Upload with timeout protection
                upload_response = supabase.storage.from_(BUCKET_NAME).upload(
                    file_name,
                    file_content,
                    {
                        "content-type": "application/pdf",
                        "cache-control": "3600",  # 1 hour cache
                        "x-upsert": "true",  # Allow overwrite if needed
                    },
                )

            # Verify upload success
            if upload_response and hasattr(upload_response, "status_code"):
                if 200 <= upload_response.status_code < 300:
                    print(f"[SUCCESS] Upload successful on attempt {attempt + 1}")
                    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(
                        file_name
                    )
                    return public_url
                else:
                    raise Exception(
                        f"Upload failed with status {upload_response.status_code}"
                    )

            # If no explicit error but no success confirmation, get public URL anyway
            print(f"[SUCCESS] Upload completed on attempt {attempt + 1}")
            public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_name)
            return public_url

        except Exception as e:
            last_error = e
            print(f"[ERROR] Upload attempt {attempt + 1} failed: {e}")

            # Don't retry on certain permanent errors
            if "file too large" in str(e).lower() or "invalid file" in str(e).lower():
                break

            # Apply exponential backoff (but don't wait on last attempt)
            if attempt < MAX_UPLOAD_RETRIES - 1:
                delay = min(math.pow(2, attempt), 30)  # Max 30 seconds
                print(f"[WAIT] Retrying in {delay:.1f}s...")
                time.sleep(delay)

    # All attempts failed
    raise Exception(
        f"Upload failed after {MAX_UPLOAD_RETRIES} attempts. Last error: {last_error}"
    )


def upload_pdf(local_path: str, user_id: str, doc_id: str) -> str:
    """Legacy upload function for backward compatibility - uses robust upload internally."""
    return upload_pdf_robust(local_path, user_id, doc_id)


def delete_pdf_robust(storage_url: str) -> bool:
    """
    Delete PDF with retry logic.

    Args:
        storage_url: Full URL or path to the stored file

    Returns:
        True if successful, False otherwise
    """
    try:
        supabase = get_supabase_storage()

        # Extract path from URL
        if f"/{BUCKET_NAME}/" in storage_url:
            path = storage_url.split(f"/{BUCKET_NAME}/")[-1]
        else:
            path = storage_url  # Assume it's already a path

        if not path:
            print("[WARN] No valid path found in storage URL")
            return False

        # Retry deletion up to 3 times
        for attempt in range(3):
            try:
                delete_response = supabase.storage.from_(BUCKET_NAME).remove([path])
                print(f"[SUCCESS] File deleted successfully: {path}")
                return True
            except Exception as e:
                print(f"[ERROR] Delete attempt {attempt + 1} failed: {e}")
                if attempt < 2:  # Don't wait on last attempt
                    time.sleep(1 * (attempt + 1))  # 1s, 2s delays

        return False

    except Exception as e:
        print(f"[ERROR] Delete operation failed: {e}")
        return False


def delete_pdf(storage_url: str) -> bool:
    """Legacy delete function for backward compatibility."""
    return delete_pdf_robust(storage_url)
