
import { useEffect, useState } from "react";
import {
  ShieldCheck, ShieldAlert, Activity, ScanSearch,
  LayoutDashboard, History, Settings, Bell, Search,
  ArrowUpRight, LockKeyhole, Terminal, Zap,
  CheckCircle2, AlertTriangle, RefreshCw, Send,
  Clock3, Eye, CircleHelp, Server, BrainCircuit
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [stats, setStats] = useState(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeNav, setActiveNav] = useState("Overview");

  async function loadDashboard() {
    try {
      const response = await fetch(`${API_URL}/dashboard/stats`);
      if (!response.ok) throw new Error("Stats unavailable");
      setStats(await response.json());
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(loadDashboard, 10000);
    return () => clearInterval(timer);
  }, []);

  async function inspectPrompt(event) {
    event.preventDefault();
    if (!prompt.trim()) {
      setError("Enter a prompt before starting the scan.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/inspect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prompt.trim() }),
      });

      if (!response.ok) throw new Error("The API could not inspect this prompt.");
      setResult(await response.json());
      await loadDashboard();
    } catch {
      setError("Cannot reach the security API. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  const actions = stats?.actions || {};
  const risks = stats?.risks || {};
  const history = stats?.recent_scans || [];
  const total = stats?.total_scans || 0;

  const pieData = [
    { name: "Allowed", value: actions.ALLOW || 0, color: "#39d9a3" },
    { name: "Blocked", value: actions.BLOCK || 0, color: "#ff6482" },
    { name: "Review", value: actions.REVIEW || 0, color: "#f6bd60" },
  ].filter((item) => item.value > 0);

  const riskData = Object.entries(risks).map(([name, value]) => ({
    name, value,
  }));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><ShieldCheck size={24} /></div>
          <div>
            <h2>prompt<span>shield</span></h2>
            <p>AI SECURITY PLATFORM</p>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        {[
          { name: "Overview", icon: LayoutDashboard },
          { name: "Prompt Scanner", icon: ScanSearch },
          { name: "Scan History", icon: History },
        ].map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={`nav-item ${activeNav === name ? "active" : ""}`}
            onClick={() => {
              setActiveNav(name);
              document.getElementById(
                name === "Overview" ? "overview" :
                name === "Prompt Scanner" ? "scanner" : "history"
              )?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <Icon size={18} /> <span>{name}</span>
            {name === "Prompt Scanner" && <span className="nav-dot" />}
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="protection-card">
            <div className="protection-icon"><LockKeyhole size={19} /></div>
            <h3>Security first.</h3>
            <p>Inspect prompts before they reach your AI systems.</p>
            <div className="protection-status">
              <span className="pulse-dot" /> Detection engine ready
            </div>
          </div>
          <div className="profile">
            <div className="avatar">PS</div>
            <div><strong>Security Console</strong><small>Local workspace</small></div>
            <Settings size={17} className="profile-settings" />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{activeNav}</strong></div>
          <div className="top-actions">
            <div className={`connection ${apiOnline ? "online" : "offline"}`}>
              <span className="pulse-dot" />
              {apiOnline ? "API Connected" : "API Offline"}
            </div>
            <button className="icon-button" title="Search"><Search size={18} /></button>
            <button className="icon-button" title="Notifications"><Bell size={18} /></button>
            <div className="top-avatar">PS</div>
          </div>
        </header>

        <section className="welcome-section" id="overview">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> THREAT MONITORING CENTER</div>
            <h1>Your AI. <span>Your rules.</span></h1>
            <p className="welcome-description">
              Monitor prompt activity, inspect suspicious inputs, and understand your security signals.
            </p>
          </div>
          <button className="primary-button" onClick={() =>
            document.getElementById("prompt-input")?.focus()
          }>
            <ScanSearch size={17} /> New scan <ArrowUpRight size={16} />
          </button>
        </section>

        <section className="metrics-grid">
          <Metric icon={Activity} label="Total scans" value={total} note="Recorded inspections" tone="blue" />
          <Metric icon={CheckCircle2} label="Allowed prompts" value={actions.ALLOW || 0} note="Passed rule checks" tone="green" />
          <Metric icon={ShieldAlert} label="Blocked prompts" value={actions.BLOCK || 0} note="Blocked by detection rules" tone="red" />
          <Metric icon={Eye} label="Needs review" value={actions.REVIEW || 0} note="Flagged for closer inspection" tone="amber" />
        </section>

        <section className="scanner-panel panel" id="scanner">
          <div className="panel-heading">
            <div className="heading-icon scanner-icon"><ScanSearch size={21} /></div>
            <div>
              <h2>Prompt security scanner</h2>
              <p>Analyze an input using your existing rules and ML model.</p>
            </div>
            <div className="live-tag"><span className="pulse-dot" /> LIVE ENGINE</div>
          </div>

          <form onSubmit={inspectPrompt}>
            <label htmlFor="prompt-input">PROMPT INPUT</label>
            <textarea
              id="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Paste a prompt to inspect for suspicious instructions or sensitive data..."
              rows={5}
              maxLength={10000}
            />
            <div className="input-footer">
              <span>{prompt.length.toLocaleString()} / 10,000 characters</span>
              <button className="primary-button scan-button" type="submit" disabled={loading}>
                {loading ? <RefreshCw className="spin" size={17} /> : <Zap size={17} />}
                {loading ? "Inspecting..." : "Inspect prompt"}
                {!loading && <Send size={15} />}
              </button>
            </div>
          </form>

          {error && <div className="error-box"><AlertTriangle size={18} /> {error}</div>}

          {result && (
            <div className="result-panel">
              <div className="result-title">
                <div>
                  <span className="eyebrow">INSPECTION RESULT</span>
                  <h3>Analysis complete</h3>
                </div>
                <span className={`decision-badge ${(result.action || "").toLowerCase()}`}>
                  {result.action || "UNKNOWN"}
                </span>
              </div>
              <p className="result-message">{result.message || "Inspection completed."}</p>
              <div className="result-metrics">
                <div><small>RISK LEVEL</small><strong>{result.risk || "Unknown"}</strong></div>
                <div><small>ML PREDICTION</small><strong>{result.ml_prediction || "Unavailable"}</strong></div>
              </div>
              <h4>Detection findings</h4>
              {result.findings?.length ? (
                <ul className="findings-list">
                  {result.findings.map((finding, index) => (
                    <li key={index}><AlertTriangle size={15} /> {String(finding)}</li>
                  ))}
                </ul>
              ) : <p className="muted-text">No rule-based findings were returned.</p>}
              <p className="disclaimer">Prototype detection can produce false positives and may miss threats.</p>
            </div>
          )}
        </section>

        <section className="charts-grid">
          <div className="panel chart-panel">
            <div className="panel-heading compact">
              <div><h2>Security decisions</h2><p>Recorded outcomes across all scans</p></div>
              <span className="subtle-icon"><Activity size={18} /></span>
            </div>
            {pieData.length ? (
              <div className="decision-chart">
                <div className="donut-wrap">
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name"
                        innerRadius={58} outerRadius={78} paddingAngle={4} stroke="none">
                        {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#111b30", border: "1px solid #263652", borderRadius: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center"><strong>{total}</strong><span>TOTAL SCANS</span></div>
                </div>
                <div className="chart-legend">
                  {[
                    ["Allowed", actions.ALLOW || 0, "#39d9a3"],
                    ["Blocked", actions.BLOCK || 0, "#ff6482"],
                    ["Review", actions.REVIEW || 0, "#f6bd60"],
                  ].map(([label, value, color]) => (
                    <div className="legend-row" key={label}>
                      <span className="legend-name"><i style={{ background: color }} />{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : <EmptyState text="Run a prompt inspection to populate your chart." />}
          </div>

          <div className="panel chart-panel">
            <div className="panel-heading compact">
              <div><h2>Risk distribution</h2><p>Risk levels returned by the engine</p></div>
              <span className="subtle-icon"><ShieldAlert size={18} /></span>
            </div>
            {riskData.length ? (
              <div className="risk-bars">
                {riskData.map((item) => {
                  const max = Math.max(...riskData.map((r) => r.value), 1);
                  const color = item.name.toLowerCase() === "high" ? "#ff6482" :
                    item.name.toLowerCase() === "medium" ? "#f6bd60" : "#39d9a3";
                  return (
                    <div className="risk-row" key={item.name}>
                      <div className="risk-label"><span>{item.name}</span><strong>{item.value}</strong></div>
                      <div className="bar-track"><div className="bar-fill" style={{
                        width: `${(item.value / max) * 100}%`, background: color
                      }} /></div>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyState text="Risk analytics will appear after your first scan." />}
            <div className="chart-footnote"><BrainCircuit size={15} /> Based on recorded inspection results</div>
          </div>
        </section>

        <section className="panel history-panel" id="history">
          <div className="panel-heading compact">
            <div>
              <h2>Recent scan activity</h2>
              <p>Your latest recorded security inspections</p>
            </div>
            <button className="text-button" onClick={loadDashboard}><RefreshCw size={15} /> Refresh</button>
          </div>
          {history.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>SCAN</th><th>DECISION</th><th>RISK</th><th>ML PREDICTION</th><th>TIME (UTC)</th></tr></thead>
                <tbody>
                  {history.slice(0, 10).map((scan) => (
                    <tr key={scan.id}>
                      <td><span className="scan-id"><Terminal size={14} /> #{scan.id}</span></td>
                      <td><span className={`table-badge ${(scan.action || "").toLowerCase()}`}>{scan.action}</span></td>
                      <td>{scan.risk}</td>
                      <td><span className="ml-label"><BrainCircuit size={14} /> {scan.ml_prediction || "—"}</span></td>
                      <td className="time-cell"><Clock3 size={14} /> {scan.created_at || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState text="No scans recorded yet. Your activity will appear here." />}
          <div className="history-footer"><span>Showing up to 10 recent records</span><span><Server size={14} /> Local database</span></div>
        </section>

        <footer className="footer">
          <div><ShieldCheck size={17} /> <strong>PromptShield AI</strong> <span>Security insights for safer AI.</span></div>
          <span className="footer-note"><CircleHelp size={14} /> Prototype — not a substitute for a complete security review.</span>
        </footer>
      </main>
    </div>
  );
}

function Metric({ icon: Icon, label, value, note, tone }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon size={19} /></div>
      <span className="metric-label">{label}</span>
      <div className="metric-value">{value.toLocaleString()}</div>
      <div className="metric-note"><span className={`note-dot ${tone}`} />{note}</div>
      <ArrowUpRight className="metric-arrow" size={17} />
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="empty-state"><Activity size={23} /><p>{text}</p></div>;
}

export default App;
