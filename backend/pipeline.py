"""
MoFA Pipeline Orchestrator
Chains agents sequentially: output of each agent feeds into next agent
"""
import uuid
import time
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from agents import extractor, classifier, summarizer

AGENT_MAP = {
    "Extractor": extractor.run,
    "Classifier": classifier.run,
    "Summarizer": summarizer.run,
}

# In-memory result store (pipeline_id -> result)
pipeline_results: dict = {}


def run_pipeline(agent_names: list, input_text: str) -> dict:
    """
    Execute a sequential pipeline of agents.
    Each agent's output becomes the next agent's input.
    """
    pipeline_id = str(uuid.uuid4())[:8]
    started_at = time.time()
    steps = []
    current_text = input_text
    success = True
    error_msg = None

    for i, name in enumerate(agent_names):
        step_start = time.time()

        if name not in AGENT_MAP:
            error_msg = f"Unknown agent '{name}'. Available: {list(AGENT_MAP.keys())}"
            steps.append({
                "step": i + 1,
                "agent": name,
                "input": current_text,
                "output": None,
                "error": error_msg,
                "duration_ms": 0
            })
            success = False
            break

        try:
            result = AGENT_MAP[name](current_text)
            duration = round((time.time() - step_start) * 1000, 2)

            steps.append({
                "step": i + 1,
                "agent": name,
                "engine": result.get("engine", "Python"),
                "input": current_text,
                "output": result.get("output", ""),
                "description": result.get("description", ""),
                "extra": {k: v for k, v in result.items()
                          if k not in ("agent", "engine", "output", "description")},
                "duration_ms": duration,
                "error": None
            })

            # Chain: output becomes next input
            current_text = result.get("output", current_text)

        except Exception as e:
            duration = round((time.time() - step_start) * 1000, 2)
            error_msg = str(e)
            steps.append({
                "step": i + 1,
                "agent": name,
                "input": current_text,
                "output": None,
                "error": error_msg,
                "duration_ms": duration
            })
            success = False
            break

    total_duration = round((time.time() - started_at) * 1000, 2)

    output = {
        "pipeline_id": pipeline_id,
        "original_input": input_text,
        "agents_run": agent_names,
        "steps": steps,
        "final_output": current_text,
        "success": success,
        "error": error_msg,
        "total_duration_ms": total_duration,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    pipeline_results[pipeline_id] = output
    return output


def get_result(pipeline_id: str) -> dict | None:
    return pipeline_results.get(pipeline_id)
