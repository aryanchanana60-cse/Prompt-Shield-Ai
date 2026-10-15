
from pathlib import Path

import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.security import inspect_prompt

app = FastAPI(
    title="PromptShield AI",
    description="A security gateway for inspecting AI prompts.",
    version="0.2.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# Load the trained ML model once when the API starts
MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "ml"
    / "promptshield_model.joblib"
)

ml_model = joblib.load(MODEL_PATH)


class PromptRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)


@app.get("/health")
def health_check():
    return {"status": "ok", "project": "PromptShield AI"}


@app.post("/inspect")
def inspect(request: PromptRequest):
    # Keep the existing rule-based security checks
    result = inspect_prompt(request.text)

    # Add the ML prediction
    prediction = int(ml_model.predict([request.text])[0])
    ml_label = "SUSPICIOUS" if prediction == 1 else "BENIGN"

    # Preserve the original result and include ML details
    result["ml_prediction"] = ml_label

    # If either layer flags the prompt, report it as suspicious
    if prediction == 1 and result.get("action") != "BLOCK":
        result["action"] = "REVIEW"
        result["message"] = (
            "The ML model flagged this prompt. "
            "Review it alongside the rule-based findings."
        )

    return result
