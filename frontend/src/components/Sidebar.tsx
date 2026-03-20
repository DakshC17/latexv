"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Conversation = {
  id: string;
  title: string | null;
  prompt: string;
  pdf_url: string | null;
  latex: string | null;
  status: string;
  created_at: string;
};

type SidebarProps = {
  onSelectConversation: (conv: Conversation) => void;
  onNewChat: () => void;
  currentConversationId: string | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ onSelectConversation, onNewChat, currentConversationId, isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await api.conversations.list();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setConversations([]);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    
    try {
      await api.conversations.delete(id);
      setConversations(conversations.filter(c => c.id !== id));
      if (currentConversationId === id) {
        onNewChat();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 100,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: isOpen ? 0 : "-320px",
          width: "320px",
          height: "100vh",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          zIndex: 101,
          transition: "left 0.3s ease",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>
            LatexV
          </h2>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
            }}
          >
            ✕
          </button>
        </div>

        {/* User Info & Logout */}
        <div style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "var(--accent-dim)",
              border: "1px solid var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "600",
              color: "var(--accent)",
            }}>
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <span style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              maxWidth: "150px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {user?.email}
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid var(--error)",
              background: "transparent",
              color: "var(--error)",
              fontSize: "11px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>

        {/* New Chat Button */}
        <div style={{ padding: "12px" }}>
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              background: "var(--accent)",
              color: "#0c0c0e",
              fontSize: "14px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {conversations.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv);
                  onClose();
                }}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: currentConversationId === conv.id ? "var(--accent-dim)" : "transparent",
                  border: "1px solid",
                  borderColor: currentConversationId === conv.id ? "var(--accent)" : "transparent",
                  marginBottom: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "var(--text-primary)",
                      marginBottom: "4px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {conv.title || conv.prompt.slice(0, 50)}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {new Date(conv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "4px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px",
          borderTop: "1px solid var(--border)",
        }}>
          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              background: "transparent",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--text-secondary)",
              fontSize: "13px",
              marginBottom: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>

          {showSettings && (
            <div style={{
              padding: "12px",
              borderRadius: "6px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              marginBottom: "8px",
            }}>
              <div style={{ marginBottom: "8px" }}>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Version</p>
                <p style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: "500" }}>1.0.0</p>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>AI Model</p>
                <p style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: "500" }}>Gemini 2.5 Flash</p>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Max Retries</p>
                <p style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: "500" }}>3</p>
              </div>
              <div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Rate Limit</p>
                <p style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: "500" }}>60 requests/min</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
