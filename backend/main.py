"""
MoFA Agent Pipeline API
FastAPI backend exposing pipeline orchestration via REST endpoints
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import sys, os

sys.path.insert(0, os.path.dirname(__file__))
from pipeline import run_pipeline, get_result, AGENT_MAP

app = FastAPI(
    title="MoFA Agent Pipeline API",
    description="Modular Framework for AI Agent Orchestration — Sequential Pipeline Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AVAILABLE_AGENTS = [
    {
        "id": "Extractor",
        "name": "Keyword Extractor",
        "description": "Extracts meaningful keywords from raw text",
        "engine": "Rhai (with Python fallback)",
        "input_type": "raw text",
        "output_type": "comma-separated keywords",
        "script": "scripts/extractor.rhai"
    },
    {
        "id": "Classifier",
        "name": "Sentiment Classifier",
        "description": "Classifies text sentiment: POSITIVE, NEGATIVE, or NEUTRAL",
        "engine": "Python",
        "input_type": "text or keywords",
        "output_type": "sentiment label with score",
        "script": "agents/classifier.py"
    },
    {
        "id": "Summarizer",
        "name": "Text Summarizer",
        "description": "Summarizes text to first sentence with word/char stats",
        "engine": "Python",
        "input_type": "raw text",
        "output_type": "summary string with metadata",
        "script": "agents/summarizer.py"
    },
]


class PipelineRequest(BaseModel):
    agents: List[str]
    input: str

    class Config:
        json_schema_extra = {
            "example": {
                "agents": ["Extractor", "Classifier", "Summarizer"],
                "input": "MoFA is a great framework for building modular AI agents with excellent performance."
            }
        }


@app.get("/")
def root():
    return {
        "name": "MoFA Agent Pipeline API",
        "version": "1.0.0",
        "endpoints": ["/agents", "/run-agent", "/pipeline/{id}"],
        "docs": "/docs"
    }


@app.get("/agents")
def get_agents():
    """List all available agent types with their descriptions."""
    return {
        "count": len(AVAILABLE_AGENTS),
        "agents": AVAILABLE_AGENTS
    }


@app.post("/run-agent")
def run_agent(req: PipelineRequest):
    """
    Execute a sequential agent pipeline.
    
    - Agents run in order: Agent A → Agent B → Agent C
    - Each agent's output becomes the next agent's input
    - Returns full per-step execution log
    """
    if not req.agents:
        raise HTTPException(status_code=400, detail="No agents specified in pipeline")

    if not req.input or not req.input.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty")

    if len(req.input) > 5000:
        raise HTTPException(status_code=400, detail="Input text too long (max 5000 chars)")

    unknown = [a for a in req.agents if a not in AGENT_MAP]
    if unknown:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown agents: {unknown}. Available: {list(AGENT_MAP.keys())}"
        )

    result = run_pipeline(req.agents, req.input)
    return result


@app.get("/pipeline/{pipeline_id}")
def get_pipeline(pipeline_id: str):
    """Retrieve a previous pipeline execution result by ID."""
    result = get_result(pipeline_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Pipeline '{pipeline_id}' not found. Results are stored in memory per session."
        )
    return result
