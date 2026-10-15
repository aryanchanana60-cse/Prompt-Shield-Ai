
import json
from pathlib import Path

import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.security import inspect_prompt
from backend.database import (
    initialize_database,
    save_scan,
    get_dashboard_stats,
)

# --------------------------------------------------
# Application setup
# --------------------------------------------------

app = FastAPI(
    title="PromptShield AI",
    description="A security gateway for inspecting AI prompts.",
    version="0.3.0",
)

# Allow the React development server to call this API.
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

# --------------------------------------------------
# Load the trained ML model
# --------------------------------------------------

MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "ml"
    / "promptshield_model.joblib"
)

ml_model = joblib.load(MODEL_PATH)

# Create the SQLite database and scans table.
initialize_database()


# --------------------------------------------------
# Request model
# --------------------------------------------------

class PromptRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)


# --------------------------------------------------
# Health endpoint
# --------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "project": "PromptShield AI",
    }


# --------------------------------------------------
# Prompt inspection endpoint
# --------------------------------------------------

@app.post("/inspect")
def inspect(request: PromptRequest):
    # Run the existing rule-based security checks.
    result = inspect_prompt(request.text)

    # Run the trained ML classifier.
    prediction = int(ml_model.predict([request.text])[0])

    ml_label = "SUSPICIOUS" if prediction == 1 else "BENIGN"

    result["ml_prediction"] = ml_label

    # Flag for review if ML detects risk but rules did not block.
    if prediction == 1 and result.get("action") != "BLOCK":
        result["action"] = "REVIEW"
        result["message"] = (
            "The ML model flagged this prompt. "
            "Review it alongside the rule-based findings."
        )

    # Save scan metadata without storing the full prompt.
    save_scan(
        action=result["action"],
        risk=result["risk"],
        ml_prediction=ml_label,
        findings=json.dumps(result.get("findings", [])),
    )

    return result


# --------------------------------------------------
# Dashboard statistics endpoint
# --------------------------------------------------

@app.get("/dashboard/stats")
def dashboard_stats():
    return get_dashboard_stats()
