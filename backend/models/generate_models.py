from pydantic import BaseModel
from typing import Optional, List


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class GenerateRequest(BaseModel):
    prompt: str
    conversation_history: Optional[List[ChatMessage]] = []


class GenerateResponse(BaseModel):
    latex: str
