"use client";
import { useState, useRef, useEffect } from "react";
import { api, AgentEvent } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getSessionData, setSessionData, clearSessionData } from "@/lib/session-storage";
import Sidebar from "@/components/Sidebar";
import LatexEditor from "@/components/LatexEditor";

type EditorStatus = "idle" | "planning" | "generating" | "compiling" | "fixing" | "done" | "error";

type Conversation = {
  id: string;
  title: string | null;
  prompt: string;
  latex: string | null;
  pdf_url: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
};

export default function EditorPage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<EditorStatus>("idle");
  const [latexCode, setLatexCode] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [agentMessage, setAgentMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string; content: string}>>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);
  const latexRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [isLiveEditing, setIsLiveEditing] = useState(false);
  const [originalLatex, setOriginalLatex] = useState("");

  // Persist session to localStorage with proper cleanup
  useEffect(() => {
    if (!user) return;
    
    const sessionData = getSessionData();
    
    if (sessionData.conversationId) {
      // Try to load the saved conversation
      api.conversations.get(sessionData.conversationId).then((conv) => {
        if (conv && conv.id) {
          // Conversation exists and user has access - load it
          loadConversation(conv);
        }
        setIsLoaded(true);
      }).catch((error) => {
        // Conversation not found or access denied - clear session data
        console.log("Clearing session: conversation not accessible", error);
        clearSessionData();
        setIsLoaded(true);
      });
    } else if (sessionData.latexCode || sessionData.pdfUrl) {
      // Has session data but no conversation ID - this might be orphaned data
      console.log("Clearing orphaned session data");
      clearSessionData();
      setIsLoaded(true);
    } else {
      // No session data - start fresh
      setIsLoaded(true);
    }
  }, [user]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isLoaded || !user) return;
    
    setSessionData({
      conversationId: currentConversationId || undefined,
      latexCode: latexCode || undefined,
      pdfUrl: pdfUrl || undefined
    });
  }, [currentConversationId, latexCode, pdfUrl, isLoaded, user]);

  useEffect(() => {
    if (latexRef.current) {
      latexRef.current.scrollTop = latexRef.current.scrollHeight;
    }
  }, [latexCode, status]);

  const loadConversation = (conv: Conversation) => {
    setPrompt("");
    setLatexCode(conv.latex || "");
    setPdfUrl(conv.pdf_url);
    setCurrentConversationId(conv.id);
    
    // If there's existing latex, mark as generated once
    if (conv.latex) {
      setHasGeneratedOnce(true);
      setOriginalLatex(conv.latex);
    }
    
    // Session data will be saved automatically by the useEffect hook
    
    api.conversations.touch(conv.id).catch(console.error);
    setSidebarRefresh(prev => prev + 1);
    
    const contextHistory = [
      {
        role: "user" as const,
        content: conv.prompt
      },
      {
        role: "assistant" as const,
        content: `Here is the LaTeX document:\n\n${conv.latex || "No previous document found."}`
      }
    ];
    
    setConversationHistory(contextHistory);
    setStatus(conv.latex ? "done" : "idle");
  };

  const handleNewChat = () => {
    setPrompt("");
    setLatexCode("");
    setPdfUrl(null);
    setError("");
    setAgentMessage("");
    setStatus("idle");
    setCurrentConversationId(null);
    setConversationHistory([]);
    setHasGeneratedOnce(false);
    setIsLiveEditing(false);
    setOriginalLatex("");
    
    // Clear all session data
    clearSessionData();
  };

  const startGeneration = async () => {
    if (!prompt.trim() || isStreaming || status === "compiling") return;

    const currentPrompt = prompt;
    setPrompt(""); // Clear prompt immediately
    setError("");
    
    // Check if this is subsequent generation (live editing mode)
    if (hasGeneratedOnce && latexCode.trim()) {
      // This is a subsequent prompt - use live editing
      await handleLiveEdit(currentPrompt);
    } else {
      // This is first generation - use normal generation
      await handleFirstGeneration(currentPrompt);
    }
  };

  const handleFirstGeneration = async (currentPrompt: string) => {
    setStatus("planning");
    setIsStreaming(true);
    setLatexCode("");
    setPdfUrl(null);
    setAgentMessage("Analyzing request...");

    let receivedConversationId: string | null = null;

    try {
      const result = await api.agent.stream(
        currentPrompt, 
        (data: AgentEvent) => {
          if (data.status) {
            setStatus(data.status as EditorStatus);
          }
          if (data.latex) {
            setLatexCode(data.latex);
          }
          if (data.error) {
            setError(data.error);
          }
          if (data.conversation_id) {
            receivedConversationId = data.conversation_id;
            setCurrentConversationId(data.conversation_id);
            setSidebarRefresh(prev => prev + 1);
          }
        },
        conversationHistory,
        currentConversationId
      );
      
      setIsStreaming(false);
      
      if (result?.conversation_id) {
        setCurrentConversationId(result.conversation_id);
        receivedConversationId = result.conversation_id;
      }
      
      if (latexCode || result?.latex) {
        setConversationHistory([
          ...conversationHistory,
          { role: "user", content: currentPrompt },
          { role: "assistant", content: latexCode || result?.latex || "" }
        ]);
        // Mark that we've generated once and store original
        setHasGeneratedOnce(true);
        setOriginalLatex(latexCode || result?.latex || "");
      }
      
      if (result?.pdf_url) {
        setPdfUrl(result.pdf_url);
        setStatus("done");
      } else if (result?.status === "done") {
        setStatus("done");
      } else if (result?.error) {
        setError(result.error);
        setStatus("error");
      } else {
        setStatus("idle");
      }
    } catch (err) {
      setIsStreaming(false);
      setError("Generation failed");
      setStatus("error");
    }
  };

  const handleLiveEdit = async (currentPrompt: string) => {
    setIsLiveEditing(true);
    setStatus("generating");
    setAgentMessage("Making live edits...");
    
    // Store the current latex as original if not stored yet
    if (!originalLatex) {
      setOriginalLatex(latexCode);
    }
    
    try {
      // Simulate live editing by showing gradual changes
      // In a real implementation, this would call a live editing API
      const result = await api.agent.stream(
        currentPrompt, 
        (data: AgentEvent) => {
          if (data.status) {
            setStatus(data.status as EditorStatus);
          }
          if (data.latex) {
            // Show live editing effect by gradually updating the code
            showLiveEditingEffect(latexCode, data.latex);
          }
          if (data.error) {
            setError(data.error);
          }
        },
        conversationHistory,
        currentConversationId
      );
      
      setIsLiveEditing(false);
      
      if (result?.latex) {
        setConversationHistory([
          ...conversationHistory,
          { role: "user", content: currentPrompt },
          { role: "assistant", content: result.latex }
        ]);
      }
      
      if (result?.pdf_url) {
        setPdfUrl(result.pdf_url);
        setStatus("done");
      } else if (result?.status === "done") {
        setStatus("done");
      } else if (result?.error) {
        setError(result.error);
        setStatus("error");
      } else {
        setStatus("idle");
      }
    } catch (err) {
      setIsLiveEditing(false);
      setError("Live editing failed");
      setStatus("error");
    }
  };

  const showLiveEditingEffect = (currentCode: string, newCode: string) => {
    // Create a smooth transition effect from current to new code
    const currentLines = currentCode.split('\n');
    const newLines = newCode.split('\n');
    
    // Simple diff-like approach for live editing visualization
    let displayCode = currentCode;
    
    // Animate the transition over time
    const animationSteps = 10;
    const stepDelay = 100; // ms between each step
    
    for (let i = 0; i <= animationSteps; i++) {
      setTimeout(() => {
        const progress = i / animationSteps;
        const blendedLines = newLines.slice(0, Math.floor(newLines.length * progress))
          .concat(currentLines.slice(Math.floor(newLines.length * progress)));
        
        setLatexCode(blendedLines.join('\n'));
      }, i * stepDelay);
    }
    
    // Ensure we end with the final code
    setTimeout(() => {
      setLatexCode(newCode);
    }, animationSteps * stepDelay + 100);
  };

  const compileDocument = async () => {
    if (!latexCode.trim() || status === "compiling" || isStreaming) return;

    setStatus("compiling");
    setIsStreaming(true);
    setPdfUrl(null);
    setError("");
    setAgentMessage("Compiling your changes...");

    try {
      const result = await api.agent.stream(latexCode, (data: AgentEvent) => {
        if (data.error) {
          setError(data.error);
        }
        if (data.conversation_id) {
          setCurrentConversationId(data.conversation_id);
        }
      }, []);

      setIsStreaming(false);

      if (result?.pdf_url) {
        setPdfUrl(result.pdf_url);
        setStatus("done");
        setAgentMessage("Compiled successfully!");
      } else if (result?.error) {
        setError(result.error);
        setStatus("error");
        setAgentMessage("Compilation failed");
      } else {
        setError("Compilation failed");
        setStatus("error");
        setAgentMessage("Compilation failed");
      }
    } catch (err) {
      setIsStreaming(false);
      setError("Compilation failed");
      setStatus("error");
      setAgentMessage("Compilation failed");
    }
  };

  const downloadPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  const manualCompile = async () => {
    if (!latexCode.trim() || isStreaming || status === "compiling") return;

    setStatus("compiling");
    setError("");
    setAgentMessage("Compiling...");

    try {
      const result = await api.agent.compile(latexCode);

      if (result?.pdf_url) {
        setPdfUrl(result.pdf_url);
        setStatus("done");
        setAgentMessage("Compiled successfully!");
      } else {
        setError("Compilation failed");
        setStatus("error");
        setAgentMessage("Compilation failed");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Compilation failed";
      setError(errorMessage);
      setStatus("error");
      setAgentMessage("Compilation failed");
    }
  };

  return (
    <>
      {/* Hamburger Button - Only show when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            position: "fixed",
            top: "12px",
            left: "16px",
            zIndex: 9998,
            width: "44px",
            height: "44px",
            borderRadius: "8px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "5px",
            padding: "10px",
          }}
        >
          <div style={{ width: "20px", height: "2px", background: "var(--text-primary)", borderRadius: "1px" }} />
          <div style={{ width: "20px", height: "2px", background: "var(--text-primary)", borderRadius: "1px" }} />
          <div style={{ width: "20px", height: "2px", background: "var(--text-primary)", borderRadius: "1px" }} />
        </button>
      )}

      <Sidebar 
        onSelectConversation={loadConversation}
        onNewChat={handleNewChat}
        currentConversationId={currentConversationId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        refreshTrigger={sidebarRefresh}
      />
      
      <div style={{ 
        display: "flex", 
        height: "calc(100vh - 65px)", 
        background: "var(--bg-base)",
        overflow: "hidden",
        position: "relative"
      }}>
        {/* Left Side - Editor */}
        <div className="editor-pane" style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column",
          borderRight: "1px solid var(--border)",
          overflow: "hidden"
        }}>
          {/* Agent Status Bar - Small, Above Prompt */}
          {(status !== "idle" || isLiveEditing) && (
            <div style={{
              padding: "8px 16px",
              margin: "8px 12px",
              borderRadius: "6px",
              background: isLiveEditing
                ? "rgba(139, 92, 246, 0.08)"
                : status === "planning" || status === "generating"
                ? "rgba(251, 191, 36, 0.08)"
                : status === "fixing"
                ? "rgba(248, 113, 113, 0.08)"
                : status === "compiling"
                ? "rgba(96, 165, 250, 0.08)"
                : "rgba(74, 222, 128, 0.08)",
              backdropFilter: "blur(4px)",
              border: `1px solid ${
                isLiveEditing
                  ? "rgba(139, 92, 246, 0.2)"
                  : status === "planning" || status === "generating"
                  ? "rgba(251, 191, 36, 0.2)"
                  : status === "fixing"
                  ? "rgba(248, 113, 113, 0.2)"
                  : status === "compiling"
                  ? "rgba(96, 165, 250, 0.2)"
                  : "rgba(74, 222, 128, 0.2)"
              }`,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <div style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isLiveEditing
                  ? "#8b5cf6"
                  : status === "planning" || status === "generating"
                  ? "var(--accent)"
                  : status === "fixing"
                  ? "var(--error)"
                  : status === "compiling"
                  ? "var(--info)"
                  : "var(--success)",
                animation: (isLiveEditing || status === "planning" || status === "generating" || status === "fixing" || status === "compiling")
                  ? "pulse-glow 1.5s ease-in-out infinite"
                  : "none",
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: "11px",
                fontWeight: "500",
                color: isLiveEditing
                  ? "#8b5cf6"
                  : status === "planning" || status === "generating"
                  ? "var(--accent)"
                  : status === "fixing"
                  ? "var(--error)"
                  : status === "compiling"
                  ? "var(--info)"
                  : "var(--success)",
              }}>
                {isLiveEditing ? "Live Editing"
                 : status === "planning" ? "Planning"
                 : status === "generating" ? (hasGeneratedOnce ? "Editing" : "Generating")
                 : status === "compiling" ? "Compiling"
                 : status === "fixing" ? "Self-correcting"
                 : status === "done" ? "Done"
                 : "Error"}: {agentMessage || "Processing..."}
              </span>
            </div>
          )}

          {/* LaTeX Streaming Area */}
          <div 
            ref={latexRef}
            style={{ 
              flex: 1, 
              overflowY: "auto", 
              padding: "20px",
              background: "var(--bg-base)",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {latexCode ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  marginBottom: "12px" 
                }}>
                  <div style={{ 
                    width: "8px", 
                    height: "8px", 
                    borderRadius: "50%", 
                    background: isLiveEditing 
                      ? "#8b5cf6" 
                      : isStreaming 
                      ? "var(--accent)" 
                      : "var(--success)"
                  }} />
                  <span style={{ 
                    fontSize: "12px", 
                    fontWeight: "600", 
                    color: "var(--text-primary)" 
                  }}>
                    {isLiveEditing 
                      ? "Live Editing LaTeX..." 
                      : isStreaming 
                      ? (hasGeneratedOnce ? "Editing LaTeX..." : "Generating LaTeX...")
                      : "LaTeX Code"}
                  </span>
                  {(isStreaming || isLiveEditing) && (
                    <span style={{ 
                      fontSize: "10px", 
                      color: "var(--text-muted)" 
                    }}>
                      (streaming)
                    </span>
                  )}
                </div>
                <LatexEditor
                  value={latexCode}
                  onChange={setLatexCode}
                  disabled={isStreaming}
                  isStreaming={isStreaming}
                  autoScroll={true}
                  style={{
                    flex: 1,
                    minHeight: "300px"
                  }}
                />
              </div>
            ) : (
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center", 
                height: "100%",
                color: "var(--text-muted)"
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "16px", opacity: 0.5 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <p style={{ fontSize: "14px", fontWeight: "500" }}>
                  {isStreaming || isLiveEditing ? "Generating..." : "Your LaTeX code will appear here"}
                </p>
                <p style={{ fontSize: "12px", marginTop: "8px" }}>
                  {isStreaming || isLiveEditing
                    ? "Please wait while AI generates your document" 
                    : "Enter a prompt below and click Generate to start"
                  }
                </p>
              </div>
            )}

            {error && (
              <div style={{ 
                marginTop: "16px",
                padding: "12px", 
                borderRadius: "8px", 
                background: "var(--error-dim)", 
                border: "1px solid rgba(248,113,113,0.3)"
              }}>
                <p style={{ 
                  fontSize: "12px", 
                  fontWeight: "600", 
                  color: "var(--error)", 
                  marginBottom: "4px" 
                }}>
                  Error
                </p>
                <pre style={{
                  fontSize: "11px",
                  color: "var(--error)",
                  margin: 0,
                  opacity: 0.9
                }}>
                  {error}
                </pre>
              </div>
            )}
          </div>

          {/* Prompt Input - Bottom */}
          <div style={{ 
            padding: "16px 20px", 
            borderTop: "1px solid var(--border)",
            background: "var(--bg-surface)"
          }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  startGeneration();
                }
              }}
              placeholder={hasGeneratedOnce 
                ? "Describe changes to make... (e.g., 'change title', 'add section', 'fix formatting') - Ctrl+Enter to edit"
                : "Describe your document... (Ctrl+Enter to generate)"
              }
              disabled={isStreaming || status === "compiling"}
              style={{
                width: "100%", 
                minHeight: "80px", 
                padding: "12px", 
                borderRadius: "8px",
                border: "1px solid var(--border)", 
                background: "var(--bg-base)",
                color: "var(--text-primary)", 
                fontSize: "13px", 
                lineHeight: "1.5",
                resize: "none", 
                outline: "none", 
                fontFamily: "inherit",
                marginBottom: "8px"
              }}
            />
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center"
            }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {prompt.length} chars
              </span>
              <button
                onClick={startGeneration}
                disabled={!prompt.trim() || isStreaming || status === "compiling"}
                style={{
                  padding: "8px 20px", 
                  borderRadius: "8px",
                  background: isStreaming || status === "compiling" ? "var(--text-muted)" : "var(--accent)",
                  color: "#0c0c0e", 
                  fontSize: "13px", 
                  fontWeight: "600", 
                  border: "none",
                  cursor: !prompt.trim() || isStreaming || status === "compiling" 
                    ? "not-allowed" 
                    : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {(isStreaming || isLiveEditing || status === "compiling") ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    {isLiveEditing 
                      ? "Live Editing..." 
                      : hasGeneratedOnce 
                      ? "Editing..." 
                      : "Generating..."
                    }
                  </>
                ) : (
                  <>
                    {hasGeneratedOnce ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                    {hasGeneratedOnce ? "Edit Document" : "Generate"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Center - Compile Button */}
        <div style={{ 
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          top: "20px",
          zIndex: 10,
        }}>
          <button
            className="compile-button"
            onClick={manualCompile}
            disabled={!latexCode.trim() || status === "compiling" || isStreaming}
            style={{
              padding: "10px 28px",
              borderRadius: "999px",
              background: !latexCode.trim() || status === "compiling" || isStreaming
                ? "var(--bg-elevated)" 
                : "var(--accent)",
              border: "1px solid var(--border)",
              cursor: !latexCode.trim() || status === "compiling" || isStreaming
                ? "not-allowed"
                : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: !latexCode.trim() || status === "compiling" || isStreaming
                ? "none"
                : "0 2px 12px rgba(251, 191, 36, 0.2)",
              transition: "all 0.2s ease",
              zIndex: 10,
            }}
            title="Compile to PDF"
          >
            {status === "compiling" || isStreaming ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <span style={{ 
                  fontSize: "12px", 
                  fontWeight: "600", 
                  color: "var(--text-muted)"
                }}>
                  Compiling...
                </span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={!latexCode.trim() || isStreaming ? "var(--text-muted)" : "#0c0c0e"} strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <span style={{ 
                  fontSize: "12px", 
                  fontWeight: "600", 
                  color: !latexCode.trim() || isStreaming ? "var(--text-muted)" : "#0c0c0e"
                }}>
                  Compile
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right Side - PDF Display */}
        <div style={{ 
          width: "50%", 
          display: "flex", 
          flexDirection: "column",
          background: "var(--bg-surface)",
          overflow: "hidden"
        }}>
          {/* PDF Preview Area */}
          <div className="preview-pane" style={{ 
            flex: 1, 
            overflow: "auto",
            background: "var(--bg-base)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {pdfUrl && (
              <button
                onClick={downloadPDF}
                style={{
                  position: "absolute",
                  bottom: "24px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "10px 24px",
                  borderRadius: "8px",
                  background: "var(--accent)",
                  color: "#0c0c0e",
                  fontSize: "13px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                  zIndex: 10,
                  boxShadow: "0 4px 16px rgba(251, 191, 36, 0.3)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PDF
              </button>
            )}
            
            {pdfUrl ? (
              <div style={{
                width: "100%",
                height: "100%",
                background: "white"
              }}>
                <iframe
                  src={pdfUrl}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none"
                  }}
                  title="PDF Preview"
                />
              </div>
            ) : status === "compiling" ? (
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center", 
                height: "100%",
                color: "var(--text-muted)"
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "16px", animation: "spin 1s linear infinite", opacity: 0.5 }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <p style={{ fontSize: "14px", fontWeight: "500" }}>
                  Compiling to PDF...
                </p>
                <p style={{ fontSize: "12px", marginTop: "8px" }}>
                  This may take a few seconds
                </p>
              </div>
            ) : (
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center", 
                height: "100%",
                color: "var(--text-muted)"
              }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "16px", opacity: 0.4 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M9 15h6M9 11h6M9 19h4" />
                </svg>
                <p style={{ fontSize: "14px", fontWeight: "500" }}>
                  No document compiled
                </p>
                <p style={{ fontSize: "12px", marginTop: "8px", textAlign: "center", maxWidth: "300px" }}>
                  Generate LaTeX code and click Compile
                </p>
              </div>
            )}
          </div>
        </div>

        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes fadeUp {
            from { 
              opacity: 0; 
              transform: translateY(10px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          
          @keyframes pulse-glow {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
          }
        `}</style>
      </div>
    </>
  );
}
