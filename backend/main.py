
from fastapi import FastAPI
from pydantic import BaseModel, Field

from backend.security import inspect_prompt

app = FastAPI(
    title="PromptShield AI",
    description="A security gateway for inspecting AI prompts.",
    version="0.1.0",
)


class PromptRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)


@app.get("/health")
def health_check():
    return {"status": "ok", "project": "PromptShield AI"}


@app.post("/inspect")
def inspect(request: PromptRequest):
    return inspect_prompt(request.text)
