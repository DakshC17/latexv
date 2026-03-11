from fastapi import APIRouter
from models.compile_models import CompileRequest, CompileResponse
from models.generate_models import GenerateRequest,GenerateResponse

router = APIRouter()

@router.get("/")
def health_check():
    return {"Status":"Running"}

@router.post("/generate", response_model=GenerateResponse)
async def generate_request(data:GenerateRequest):

    prompt = data.prompt
    latex_output = f"Generated latex for {prompt}"
    return GenerateResponse(latex=latex_output)


@router.post("/compile",response_model=CompileResponse)
async def compile_latex(data:CompileRequest):
    latex_code = data.latex
    print(latex_code)
    return CompileResponse(response="response successfull")