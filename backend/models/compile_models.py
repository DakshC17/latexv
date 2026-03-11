from pydantic import BaseModel

class CompileRequest(BaseModel):
    latex: str


class CompileResponse(BaseModel):
    response: str