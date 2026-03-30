from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


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
    user_id: Optional[str] = None
    title: Optional[str] = None
    prompt: str
    latex: str
    status: str = "pending"


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    latex: Optional[str] = None
    pdf_url: Optional[str] = None
    status: Optional[str] = None


class Conversation(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: Optional[str] = None
    prompt: str
    response: Optional[str] = None
    pdf_url: Optional[str] = None
    latex: Optional[str] = None
    status: str = "completed"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ConversationCreate(BaseModel):
    user_id: Optional[str] = None
    title: Optional[str] = None
    prompt: str
    response: Optional[str] = None
    pdf_url: Optional[str] = None
    latex: Optional[str] = None
    status: str = "completed"


class WaitlistEntry(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    source: str = "website"
    status: str = "active"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class WaitlistCreate(BaseModel):
    email: EmailStr
    source: str = "website"


class WaitlistUpdate(BaseModel):
    status: Optional[str] = None
