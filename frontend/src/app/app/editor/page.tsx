"use client";
import { useState, useRef, useEffect } from "react";
import { api, AgentEvent, JobStatus } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type AgentStatus = "idle" | "submitting" | "running" | "done" | "error";
type StreamEvent = {
  node: string;
  status: string;
  latex?: string;
  error?: string;
  retries?: number;
};

type Tab = "stream" | "async" | "versions";
type Version = {
  id: string;
  version_number: number;
  latex: string;
  pdf_url: string;
  prompt: string;
  status: string;
  created_at: string;
};

export default function EditorPage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [tab, setTab] = useState<Tab>("stream");
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [finalLatex, setFinalLatex] = useState("");
  const [finalError, setFinalError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStep, setJobStep] = useState("");
  const [polling, setPolling] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [events]);

  useEffect(() => {
    api.documents.list().then(setDocuments).catch(() => setDocuments([]));
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const loadVersions = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    setSelectedDoc(doc);
    const vers = await api.documents.getVersions(docId);
    setVersions(Array.isArray(vers) ? vers : []);
    setTab("versions");
  };

  const runAgent = async () => {
    if (!prompt.trim() || status === "running") return;

    setStatus("running");
    setEvents([]);
    setPdfUrl(null);
    setFinalLatex("");
    setFinalError("");
    setAttempts(0);

    try {
      const result = await api.agent.stream(prompt, (data: AgentEvent) => {
        const node =
          data.status === "generating" ? "generate" :
          data.status === "compiling" ? "compile" :
          data.status === "fixing" ? "fix" : "unknown";

        setEvents((prev) => [
          ...prev,
          { node, status: data.status || "unknown", latex: data.latex, error: data.error, retries: data.retries },
        ]);

        if (data.retries !== undefined) setAttempts(data.retries);
        if (data.latex) setFinalLatex(data.latex);
        if (data.error) setFinalError(data.error);
      });

      if (result?.pdf_url) { setPdfUrl(result.pdf_url); setStatus("done"); }
      else if (result?.pdf_path) { setPdfUrl(result.pdf_path); setStatus("done"); }
      else { setStatus("error"); }
    } catch { setStatus("error"); }
  };

  const runAsync = async () => {
    if (!prompt.trim() || status === "submitting") return;

    setStatus("submitting");
    setPdfUrl(null);
    setFinalError("");

    try {
      const result = await api.agent.submitAsync(prompt);
      setJobId(result.job_id);
      setPolling(true);

      pollRef.current = setInterval(async () => {
        const statusResult: JobStatus = await api.agent.getStatus(result.job_id);
        setJobStep(statusResult.meta?.step || statusResult.status);

        if (statusResult.status === "success" || statusResult.status === "done") {
          clearInterval(pollRef.current!);
          setPolling(false);
          setPdfUrl(statusResult.pdf_url || null);
          setFinalLatex(statusResult.latex || "");
          setStatus("done");
          api.documents.list().then(setDocuments);
        } else if (statusResult.status === "failure") {
          clearInterval(pollRef.current!);
          setPolling(false);
          setFinalError(statusResult.error || "Job failed");
          setStatus("error");
        }
      }, 2000);
    } catch { setStatus("error"); }
  };

  const getStatusColor = (node: string) => {
    switch (node) {
      case "generate": return "var(--accent)";
      case "compile": return "var(--info)";
      case "fix": return "var(--success)";
      default: return "var(--text-muted)";
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case "generating": return "Generating LaTeX...";
      case "compiling": return "Compiling PDF...";
      case "fixing": return "Fixing errors...";
      case "done": return "Done!";
      default: return s;
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 65px)", background: "var(--bg-base)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border-subtle)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>Create Document</h2>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            {(["stream", "async"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "6px 16px",
                  borderRadius: "6px",
                  border: "1px solid",
                  borderColor: tab === t ? "var(--accent)" : "var(--border)",
                  background: tab === t ? "var(--accent-dim)" : "transparent",
                  color: tab === t ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: "12px",
                  fontWeight: "500",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {t === "stream" ? "Streaming" : "Background"}
              </button>
            ))}
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your document..."
            disabled={status === "running" || status === "submitting"}
            style={{
              width: "100%", minHeight: "100px", padding: "12px", borderRadius: "10px",
              border: "1px solid var(--border)", background: "var(--bg-surface)",
              color: "var(--text-primary)", fontSize: "13px", lineHeight: "1.6",
              resize: "vertical", outline: "none", fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{prompt.length} chars</span>
            <button
              onClick={tab === "stream" ? runAgent : runAsync}
              disabled={!prompt.trim() || status === "running" || status === "submitting"}
              style={{
                padding: "8px 20px", borderRadius: "8px",
                background: (status === "running" || status === "submitting") ? "var(--text-muted)" : "var(--accent)",
                color: "#0c0c0e", fontSize: "13px", fontWeight: "600", border: "none",
                cursor: !prompt.trim() || status === "running" || status === "submitting" ? "not-allowed" : "pointer",
              }}
            >
              {(status === "running" || status === "submitting") ? "Processing..." : "Generate"}
            </button>
          </div>
        </div>

        <div ref={logRef} style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {polling && (
            <div style={{ padding: "14px", borderRadius: "10px", background: "var(--info-dim)", border: "1px solid rgba(96,165,250,0.2)", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--info)", animation: "pulse-glow 1.5s infinite" }} />
                <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--info)" }}>{jobStep || "Processing..."}</span>
              </div>
              <p style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace", marginTop: "4px" }}>Job: {jobId?.slice(0, 8)}...</p>
            </div>
          )}

          {events.map((event, i) => (
            <div key={i} style={{ marginBottom: "14px", animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: getStatusColor(event.node) }} />
                <span style={{ fontSize: "11px", fontWeight: "600", color: getStatusColor(event.node), textTransform: "uppercase" }}>{event.node}</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{getStatusLabel(event.status)}</span>
                {event.status === "fixing" && event.retries !== undefined && (
                  <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "100px", background: "var(--success-dim)", color: "var(--success)" }}>Attempt {event.retries + 1}</span>
                )}
              </div>
              {event.latex && (
                <pre className="mono" style={{ fontSize: "10px", color: "var(--text-secondary)", background: "var(--bg-surface)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-subtle)", maxHeight: "100px", overflowY: "auto", margin: 0, whiteSpace: "pre-wrap" }}>
                  {event.latex.slice(0, 400)}{event.latex.length > 400 ? "\n..." : ""}
                </pre>
              )}
            </div>
          ))}

          {status === "done" && pdfUrl && (
            <div style={{ padding: "20px", borderRadius: "12px", background: "var(--success-dim)", border: "1px solid rgba(74,222,128,0.2)", textAlign: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" style={{ margin: "0 auto 8px", display: "block" }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--success)", marginBottom: "12px" }}>Done!</p>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 20px", borderRadius: "8px", background: "var(--success)", color: "#0c0c0e", fontSize: "13px", fontWeight: "600", textDecoration: "none" }}>
                View PDF
              </a>
            </div>
          )}

          {status === "error" && (
            <div style={{ padding: "14px", borderRadius: "10px", background: "var(--error-dim)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--error)", marginBottom: "6px" }}>Failed after {attempts} attempts</p>
              {finalError && <pre className="mono" style={{ fontSize: "10px", color: "var(--error)", opacity: "0.8", margin: 0 }}>{finalError.slice(0, 200)}</pre>}
            </div>
          )}
        </div>
      </div>

      <div style={{ width: "300px", display: "flex", flexDirection: "column", background: "var(--bg-surface)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>Documents</h3>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {documents.length === 0 ? (
            <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>No documents yet</p>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => loadVersions(doc.id)}
                style={{
                  padding: "12px", borderRadius: "8px",
                  background: selectedDoc?.id === doc.id ? "var(--accent-dim)" : "var(--bg-elevated)",
                  border: "1px solid", borderColor: selectedDoc?.id === doc.id ? "var(--accent)" : "var(--border-subtle)",
                  marginBottom: "8px", cursor: "pointer",
                }}
              >
                <p style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {doc.title || doc.prompt?.slice(0, 40) || "Untitled"}
                </p>
                <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{new Date(doc.created_at).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>

        {tab === "versions" && selectedDoc && versions.length > 0 && (
          <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "16px", maxHeight: "300px", overflowY: "auto" }}>
            <h4 style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>Versions</h4>
            {versions.map((v) => (
              <div key={v.id} style={{ padding: "10px", borderRadius: "6px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--accent)" }}>v{v.version_number}</span>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{new Date(v.created_at).toLocaleDateString()}</span>
                </div>
                {v.pdf_url && (
                  <a href={v.pdf_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "var(--info)", textDecoration: "none" }}>View PDF</a>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-subtle)" }}>
          <p style={{ fontSize: "10px", color: "var(--text-muted)", textAlign: "center" }}>{user?.email}</p>
        </div>
      </div>
    </div>
  );
}
