from pydantic import BaseModel

class GenerateRequest(BaseModel):
    prompt: str

class GenerateResponse(BaseModel):
    latex: str
