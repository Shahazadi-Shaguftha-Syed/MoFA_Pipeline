import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import './App.css';

const API = 'https://mofa-backend-production.up.railway.app';

const AGENT_COLORS = {
  Extractor:  { bg: '#0f2027', border: '#00e5ff', glow: '#00e5ff' },
  Classifier: { bg: '#0f2027', border: '#b967ff', glow: '#b967ff' },
  Summarizer: { bg: '#0f2027', border: '#00ff9d', glow: '#00ff9d' },
};

const SAMPLE_INPUTS = [
  { label: "Tech Review", text: "MoFA is an excellent and powerful framework. It provides amazing tools for orchestration and delivers outstanding performance for building intelligent systems." },
  { label: "Negative Feedback", text: "This software is terrible and broken. The interface is confusing and the documentation is poor. Nothing works as expected and support is awful." },
  { label: "AI Research", text: "Artificial intelligence and machine learning are transforming software development. Researchers are building innovative systems that can understand and generate human language with remarkable accuracy." },
  { label: "Product Description", text: "Our new cloud-native platform enables teams to deploy intelligent agents at scale. Built with Rust for performance and Python for flexibility, it supports distributed workflows." },
  { label: "Neutral Statement", text: "The system processes data through three sequential stages. Each stage transforms the input and passes results to the next component in the pipeline." },
];

function AgentNode({ data }) {
  const colors = AGENT_COLORS[data.label] || { bg: '#0f2027', border: '#fff', glow: '#fff' };
  return (
    <div style={{
      background: colors.bg,
      border: `2px solid ${colors.border}`,
      borderRadius: 12,
      padding: '14px 20px',
      minWidth: 140,
      boxShadow: `0 0 18px ${colors.glow}55`,
      cursor: 'default',
      position: 'relative',
    }}>
      <div style={{ fontSize: 10, color: colors.border, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Agent</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: "'Space Mono', monospace" }}>{data.label}</div>
      {data.engine && <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>{data.engine}</div>}
      {data.status === 'running' && <div style={{ position:'absolute', top:8, right:8, width:8, height:8, borderRadius:'50%', background:'#ffdd00', animation:'pulse 1s infinite' }} />}
      {data.status === 'done' && <div style={{ position:'absolute', top:8, right:8, width:8, height:8, borderRadius:'50%', background:'#00ff9d' }} />}
      {data.status === 'error' && <div style={{ position:'absolute', top:8, right:8, width:8, height:8, borderRadius:'50%', background:'#ff4455' }} />}
    </div>
  );
}

const nodeTypes = { agentNode: AgentNode };

function buildGraph(agents, steps) {
  const statusMap = {};
  if (steps) {
    steps.forEach(s => {
      statusMap[s.agent] = s.error ? 'error' : 'done';
    });
  }

  const nodes = agents.map((agent, i) => ({
    id: `agent-${i}`,
    type: 'agentNode',
    position: { x: 80 + i * 200, y: 80 },
    data: {
      label: agent,
      engine: agent === 'Extractor' ? 'Rhai Engine' : 'Python',
      status: statusMap[agent] || 'idle'
    },
  }));

  // Input node
  nodes.unshift({
    id: 'input-node',
    position: { x: 80 + 0 * 200 - 180, y: 68 },
    data: { label: '📥 INPUT' },
    style: {
      background: '#111', border: '2px dashed #555', borderRadius: 8,
      padding: '10px 16px', color: '#aaa', fontSize: 12, fontFamily: 'monospace'
    },
  });

  // Output node
  nodes.push({
    id: 'output-node',
    position: { x: 80 + agents.length * 200, y: 68 },
    data: { label: '📤 OUTPUT' },
    style: {
      background: '#111', border: '2px dashed #00ff9d55', borderRadius: 8,
      padding: '10px 16px', color: '#00ff9d', fontSize: 12, fontFamily: 'monospace'
    },
  });

  const edges = [];

  // Input → first agent
  if (agents.length > 0) {
    edges.push({
      id: 'e-input-0',
      source: 'input-node',
      target: 'agent-0',
      animated: true,
      style: { stroke: '#555' },
    });
  }

  // Agent → agent
  for (let i = 0; i < agents.length - 1; i++) {
    edges.push({
      id: `e-${i}-${i + 1}`,
      source: `agent-${i}`,
      target: `agent-${i + 1}`,
      animated: true,
      label: 'output →',
      labelStyle: { fill: '#666', fontSize: 10 },
      style: { stroke: AGENT_COLORS[agents[i]]?.border || '#555' },
    });
  }

  // Last agent → output
  if (agents.length > 0) {
    edges.push({
      id: `e-last-output`,
      source: `agent-${agents.length - 1}`,
      target: 'output-node',
      animated: true,
      style: { stroke: '#00ff9d66' },
    });
  }

  return { nodes, edges };
}

export default function App() {
  const [availableAgents, setAvailableAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState(['Extractor', 'Classifier', 'Summarizer']);
  const [inputText, setInputText] = useState(SAMPLE_INPUTS[0].text);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    axios.get(`${API}/agents`)
      .then(r => setAvailableAgents(r.data.agents))
      .catch(() => setAvailableAgents([
        { id: 'Extractor' }, { id: 'Classifier' }, { id: 'Summarizer' }
      ]));
  }, []);

  useEffect(() => {
    const { nodes: n, edges: e } = buildGraph(selectedAgents, result?.steps);
    setNodes(n);
    setEdges(e);
  }, [selectedAgents, result]);

  const runPipeline = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await axios.post(`${API}/run-agent`, {
        agents: selectedAgents,
        input: inputText,
      });
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to connect to backend. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = (agentId) => {
    setSelectedAgents(prev =>
      prev.includes(agentId) ? prev.filter(a => a !== agentId) : [...prev, agentId]
    );
  };

  const moveAgent = (agentId, dir) => {
    setSelectedAgents(prev => {
      const idx = prev.indexOf(agentId);
      if (idx === -1) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const onConnect = useCallback((params) => setEdges(e => addEdge(params, e)), []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo">◈ MoFA</span>
          <span className="tagline">Modular Framework for AI Agent Orchestration</span>
        </div>
        <div className="header-right">
          <span className="badge">Rust Core</span>
          <span className="badge rhai">Rhai Engine</span>
          <span className="badge java">Java Client</span>
        </div>
      </header>

      <div className="main">
        {/* LEFT PANEL */}
        <div className="panel left-panel">
          <section className="section">
            <h3>Pipeline Configuration</h3>
            <p className="hint">Select agents and drag to reorder</p>
            <div className="agent-list">
              {['Extractor', 'Classifier', 'Summarizer'].map(id => (
                <div key={id} className={`agent-chip ${selectedAgents.includes(id) ? 'active' : ''}`}>
                  <label>
                    <input type="checkbox" checked={selectedAgents.includes(id)}
                      onChange={() => toggleAgent(id)} />
                    <span className="agent-dot" style={{ background: AGENT_COLORS[id]?.border }} />
                    {id}
                    <small>{id === 'Extractor' ? 'Rhai' : 'Python'}</small>
                  </label>
                  {selectedAgents.includes(id) && (
                    <div className="order-btns">
                      <button onClick={() => moveAgent(id, -1)}>↑</button>
                      <span>{selectedAgents.indexOf(id) + 1}</span>
                      <button onClick={() => moveAgent(id, 1)}>↓</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="pipeline-preview">
              {selectedAgents.map((a, i) => (
                <React.Fragment key={a}>
                  <span className="pipe-badge" style={{ borderColor: AGENT_COLORS[a]?.border, color: AGENT_COLORS[a]?.border }}>{a}</span>
                  {i < selectedAgents.length - 1 && <span className="arrow">→</span>}
                </React.Fragment>
              ))}
            </div>
          </section>

          <section className="section">
            <h3>Input Text</h3>
            <div className="samples">
              {SAMPLE_INPUTS.map((s, i) => (
                <button key={i} className={`sample-btn ${inputText === s.text ? 'active' : ''}`}
                  onClick={() => setInputText(s.text)}>
                  {s.label}
                </button>
              ))}
            </div>
            <textarea
              className="text-input"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Enter text to process through the pipeline..."
              rows={5}
            />
            <button
              className={`run-btn ${loading ? 'loading' : ''}`}
              onClick={runPipeline}
              disabled={loading || selectedAgents.length === 0}
            >
              {loading ? '⟳ Running Pipeline...' : '▶ Run Pipeline'}
            </button>
            {error && <div className="error-msg">⚠ {error}</div>}
          </section>
        </div>

        {/* CENTER - GRAPH */}
        <div className="panel center-panel">
          <div className="panel-title">Agent Pipeline Graph</div>
          <div className="flow-container">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
            >
              <Background color="#1a1a2e" gap={20} />
              <Controls />
              <MiniMap nodeColor={() => '#00e5ff22'} style={{ background: '#0a0a12' }} />
            </ReactFlow>
          </div>
        </div>

        {/* RIGHT PANEL - RESULTS */}
        <div className="panel right-panel">
          <div className="panel-title">Execution Results</div>
          {!result && !loading && (
            <div className="empty-state">
              Configure your pipeline and click<br /><strong>▶ Run Pipeline</strong>
            </div>
          )}
          {loading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Running agents...</p>
            </div>
          )}
          {result && (
            <div className="results">
              <div className="result-meta">
                <span>ID: <code>{result.pipeline_id}</code></span>
                <span className={`status-badge ${result.success ? 'ok' : 'fail'}`}>
                  {result.success ? '✓ Success' : '✗ Failed'}
                </span>
                <span>{result.total_duration_ms}ms</span>
              </div>

              <div className="result-section">
                <div className="result-label">Original Input</div>
                <div className="result-box input-box">{result.original_input}</div>
              </div>

              {result.steps.map((step, i) => (
                <div key={i} className="step-card" style={{ borderColor: AGENT_COLORS[step.agent]?.border + '88' }}>
                  <div className="step-header">
                    <span className="step-num">Step {step.step}</span>
                    <span className="step-agent" style={{ color: AGENT_COLORS[step.agent]?.border }}>{step.agent}</span>
                    <span className="step-engine">{step.engine}</span>
                    <span className="step-time">{step.duration_ms}ms</span>
                  </div>
                  {step.error
                    ? <div className="step-error">✗ {step.error}</div>
                    : <div className="step-output">{step.output}</div>
                  }
                  {step.extra?.matched_words?.length > 0 && (
                    <div className="matched-words">
                      Matched: {step.extra.matched_words.join(', ')}
                    </div>
                  )}
                </div>
              ))}

              <div className="result-section">
                <div className="result-label">Final Output</div>
                <div className="result-box final-box">{result.final_output}</div>
              </div>

              <details className="json-details">
                <summary>View Raw JSON</summary>
                <pre className="json-block">{JSON.stringify(result, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
