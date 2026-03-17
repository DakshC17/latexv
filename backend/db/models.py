from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class Document(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: Optional[str] = None
    prompt: str
    latex: str
    pdf_url: Optional[str] = None
    status: str = "pending"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DocumentCreate(BaseModel):
    user_id: str
    title: Optional[str] = None
    prompt: str
    latex: str
    status: str = "pending"


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    latex: Optional[str] = None
    pdf_url: Optional[str] = None
    status: Optional[str] = None
