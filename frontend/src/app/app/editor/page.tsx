"use client";
import { useState, useRef, useEffect } from "react";
import { api, AgentEvent } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type AgentStatus = "idle" | "running" | "done" | "error";
type StreamEvent = {
  node: string;
  status: string;
  latex?: string;
  error?: string;
  retries?: number;
};

export default function EditorPage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [finalLatex, setFinalLatex] = useState("");
  const [finalError, setFinalError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showDocs, setShowDocs] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events]);

  useEffect(() => {
    api.documents.list().then(setDocuments).catch(() => setDocuments([]));
  }, []);

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
        const node = data.status === "generating" ? "generate" : data.status === "compiling" ? "compile" : data.status === "fixing" ? "fix" : "unknown";

        setEvents((prev) => [
          ...prev,
          {
            node,
            status: data.status || "unknown",
            latex: data.latex,
            error: data.error,
            retries: data.retries,
          },
        ]);

        if (data.retries !== undefined) setAttempts(data.retries);
        if (data.latex) setFinalLatex(data.latex);
        if (data.error) setFinalError(data.error);
      });

      if (result?.pdf_url) {
        setPdfUrl(result.pdf_url);
        setStatus("done");
      } else if (result?.pdf_path) {
        setPdfUrl(result.pdf_path);
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
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

  const currentEvent = events[events.length - 1];

  return (
    <div style={{ display: "flex", height: "calc(100vh - 65px)", background: "var(--bg-base)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border-subtle)" }}>
        <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "16px" }}>
            Create Document
          </h2>
          <div style={{ position: "relative" }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your document... e.g. 'A professional resume for a software engineer with 5 years experience'"
              disabled={status === "running"}
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: "14px",
                lineHeight: "1.6",
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {prompt.length} characters
            </span>
            <button
              onClick={runAgent}
              disabled={!prompt.trim() || status === "running"}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                background: status === "running" ? "var(--text-muted)" : "var(--accent)",
                color: "#0c0c0e",
                fontSize: "14px",
                fontWeight: "600",
                border: "none",
                cursor: status === "running" || !prompt.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {status === "running" && (
                <div style={{ width: "14px", height: "14px", border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#0c0c0e", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              )}
              {status === "running" ? "Generating..." : "Generate & Compile"}
            </button>
          </div>
        </div>

        <div
          ref={logRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 32px",
          }}
        >
          {events.length === 0 && status === "idle" && (
            <div style={{ textAlign: "center", marginTop: "60px", color: "var(--text-muted)", fontSize: "14px" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block", opacity: "0.3" }}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Enter a prompt above to generate your LaTeX document
            </div>
          )}

          {events.map((event, i) => (
            <div key={i} style={{ marginBottom: "20px", animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: getStatusColor(event.node) }} />
                <span style={{ fontSize: "12px", fontWeight: "600", color: getStatusColor(event.node), textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {event.node}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {getStatusLabel(event.status)}
                </span>
                {event.status === "fixing" && event.retries !== undefined && (
                  <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "100px", background: "var(--success-dim)", color: "var(--success)" }}>
                    Attempt {event.retries + 1}
                  </span>
                )}
              </div>

              {event.latex && (
                <div
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    padding: "12px",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  <pre className="mono" style={{ fontSize: "11px", lineHeight: "1.7", color: "var(--text-secondary)", whiteSpace: "pre-wrap", margin: 0 }}>
                    {event.latex.slice(0, 800)}{event.latex.length > 800 ? "\n... (truncated)" : ""}
                  </pre>
                </div>
              )}

              {event.error && (
                <div style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--error-dim)", border: "1px solid rgba(248,113,113,0.2)", fontSize: "12px", color: "var(--error)", fontFamily: "JetBrains Mono, monospace", lineHeight: "1.6", maxHeight: "150px", overflowY: "auto" }}>
                  {event.error.slice(0, 400)}
                  {event.error.length > 400 && "\n... (truncated)"}
                </div>
              )}
            </div>
          ))}

          {status === "done" && pdfUrl && (
            <div
              style={{
                padding: "20px",
                borderRadius: "12px",
                background: "var(--success-dim)",
                border: "1px solid rgba(74,222,128,0.2)",
                textAlign: "center",
                animation: "fadeUp 0.3s ease",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" style={{ margin: "0 auto 8px", display: "block" }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--success)", marginBottom: "12px" }}>
                PDF compiled successfully!
              </p>
              <a
                href={pdfUrl}
                download="document.pdf"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  background: "var(--success)",
                  color: "#0c0c0e",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PDF
              </a>
            </div>
          )}

          {status === "error" && (
            <div style={{ padding: "16px", borderRadius: "12px", background: "var(--error-dim)", border: "1px solid rgba(248,113,113,0.2)", animation: "fadeUp 0.3s ease" }}>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--error)", marginBottom: "8px" }}>
                Compilation failed after {attempts} attempts
              </p>
              {finalError && (
                <pre className="mono" style={{ fontSize: "11px", color: "var(--error)", lineHeight: "1.6", opacity: "0.8" }}>
                  {finalError.slice(0, 300)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ width: "320px", display: "flex", flexDirection: "column", background: "var(--bg-surface)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>Recent Documents</h3>
          <button
            onClick={() => setShowDocs(!showDocs)}
            style={{ fontSize: "12px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
          >
            {showDocs ? "Hide" : "Show"}
          </button>
        </div>

        {showDocs && (
          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            {documents.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>No documents yet</p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    marginBottom: "8px",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                >
                  <p style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.title || doc.prompt?.slice(0, 50) || "Untitled"}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {!showDocs && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center" }}>
              {documents.length} document{documents.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        )}

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center" }}>
            Logged in as {user?.email}
          </p>
        </div>
      </div>
    </div>
  );
}
