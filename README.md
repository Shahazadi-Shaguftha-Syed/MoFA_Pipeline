# MoFA Agent Pipeline — Project Submission

> **Modular Framework for AI Agent Orchestration**  
> Sequential agent pipeline with visual UI, REST API, Rhai scripting, Python backend, and Java client.

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Core Framework | MoFA (Rust) | Architecture reference & ecosystem |
| Scripting Engine | Rhai | Agent logic scripts (extractor.rhai etc.) |
| Backend API | Python + FastAPI | REST endpoints, pipeline orchestration |
| Frontend | React + ReactFlow | Visual pipeline graph + execution UI |
| Interoperability | Java (HTTP client) | Multi-language binding demonstration |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     MoFA Pipeline                       │
│                                                         │
│  React UI  ──POST /run-agent──▶  FastAPI Backend        │
│     │                               │                   │
│  ReactFlow                    Pipeline Orchestrator      │
│  (visual                           │                    │
│   graph)          ┌────────────────┼──────────────┐     │
│                   ▼                ▼              ▼     │
│              Extractor        Classifier      Summarizer │
│           (Rhai Script)      (Python)         (Python)  │
│                   │                │              │     │
│                   └────────────────┴──────────────┘     │
│                         Sequential chain                 │
│                   output A → input B → output C          │
└─────────────────────────────────────────────────────────┘

Java Client ──▶ GET /agents, POST /run-agent, GET /pipeline/{id}
```

---

## Setup & Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- Java 17+ (for Java client)

### 1. Backend

```bash
cd backend
pip3 install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for interactive Swagger UI.

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Visit `http://localhost:3000`

### 3. Java Client

```bash
cd bindings
javac JavaClient.java
java JavaClient
```

Make sure the backend is running first.

---

## API Contract

### GET /agents
Returns all registered agent types.

**Response:**
```json
{
  "count": 3,
  "agents": [
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
      "output_type": "sentiment label with score"
    },
    {
      "id": "Summarizer",
      "name": "Text Summarizer",
      "description": "Summarizes text to first sentence with word/char stats",
      "engine": "Python",
      "input_type": "raw text",
      "output_type": "summary string with metadata"
    }
  ]
}
```

---

### POST /run-agent
Execute a sequential agent pipeline.

**Request body:**
```json
{
  "agents": ["Extractor", "Classifier", "Summarizer"],
  "input": "MoFA is an excellent framework for building modular AI agents."
}
```

**Pipeline Configuration Format:**
- `agents`: ordered list of agent IDs to run sequentially
- `input`: raw text string (max 5000 chars)
- Output of each agent becomes the input of the next

**Response:**
```json
{
  "pipeline_id": "a1b2c3d4",
  "original_input": "MoFA is an excellent framework...",
  "agents_run": ["Extractor", "Classifier", "Summarizer"],
  "steps": [
    {
      "step": 1,
      "agent": "Extractor",
      "engine": "Rhai",
      "input": "MoFA is an excellent framework...",
      "output": "mofa, excellent, framework, building, modular, agents",
      "description": "Keywords extracted via Rhai scripting engine",
      "duration_ms": 12.4,
      "error": null
    },
    {
      "step": 2,
      "agent": "Classifier",
      "engine": "Python",
      "input": "mofa, excellent, framework, building, modular, agents",
      "output": "POSITIVE (score: +2)",
      "label": "POSITIVE",
      "matched_words": ["excellent"],
      "duration_ms": 0.8
    },
    {
      "step": 3,
      "agent": "Summarizer",
      "engine": "Python",
      "input": "POSITIVE (score: +2)",
      "output": "POSITIVE (score: +2). [Stats: 4 words, 22 chars, 1 sentences]",
      "duration_ms": 0.5
    }
  ],
  "final_output": "POSITIVE (score: +2). [Stats: 4 words, 22 chars, 1 sentences]",
  "success": true,
  "error": null,
  "total_duration_ms": 14.2,
  "timestamp": "2025-01-01T00:00:00Z"
}
```

---

### GET /pipeline/{id}
Retrieve a stored pipeline execution result.

**Response:** Same format as POST /run-agent response.

**Error (404):**
```json
{
  "detail": "Pipeline 'abc123' not found. Results are stored in memory per session."
}
```

---

## Error Handling

| Error | HTTP Code | Description |
|---|---|---|
| No agents specified | 400 | `agents` list is empty |
| Empty input text | 400 | `input` is blank |
| Input too long | 400 | Input exceeds 5000 chars |
| Unknown agent name | 400 | Agent ID not in registry |
| Agent fails mid-pipeline | 200 | Pipeline halts, partial results returned with `success: false` |
| Pipeline ID not found | 404 | ID doesn't exist in memory store |

---

## Agent Logic (Rhai Scripts)

Agents use embedded Rhai scripts for their transformation logic:

- `scripts/extractor.rhai` — keyword extraction with stopword filtering
- `scripts/classifier.rhai` — positive/negative word matching
- `scripts/summarizer.rhai` — first-sentence extraction with stats

These scripts run via the Rhai embedded scripting engine (hot-swappable, no recompilation needed).

---

## Sample Inputs

See `sample-inputs/samples.json` for 5 sample pipeline configurations demonstrating:
1. Full 3-agent pipeline on positive tech review
2. Full pipeline on negative feedback
3. Extractor-only on AI research text
4. Classifier + Summarizer on product description
5. Full pipeline on neutral statement

---

## Java Interoperability

`bindings/JavaClient.java` demonstrates Java consuming the MoFA pipeline API directly — representing how UniFFI would expose the Rust core to JVM languages. Run:

```bash
javac JavaClient.java && java JavaClient
```

---

## Pipeline Configuration Format

```json
{
  "agents": ["AgentId1", "AgentId2", "AgentId3"],
  "input": "Your text here"
}
```

Rules:
- Agents run **left to right** in strict sequence
- Each agent's `output` field becomes the next agent's `input`
- Any agent failure halts the pipeline (partial results saved)
- Minimum 1 agent, maximum 10 agents per pipeline
- Agent IDs are case-sensitive: `Extractor`, `Classifier`, `Summarizer`
