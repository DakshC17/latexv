"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "Natural Language Input",
    description: "Describe your document in plain English. Our AI understands your intent and generates properly formatted LaTeX.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: "Real-time Streaming",
    description: "Watch your LaTeX code appear character by character. No waiting, no guesswork — see the generation in action.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    title: "Auto-correction",
    description: "Compilation errors? Our AI self-corrects automatically, retrying up to 3 times to ensure your document compiles.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    title: "Split-pane Editor",
    description: "Edit generated LaTeX on the left, preview PDF on the right. Make changes and recompile with a single click.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Session History",
    description: "All your conversations are saved. Pick up where you left off, revisit past documents, or start fresh anytime.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    title: "Instant PDF Export",
    description: "Download your compiled PDF instantly. Share it, print it, submit it — your document is ready to go.",
  },
];

const steps = [
  {
    number: "01",
    title: "Describe Your Document",
    description: "Type a natural language prompt describing what you want — a resume, research paper, beamer presentation, or anything else.",
  },
  {
    number: "02",
    title: "Watch AI Generate",
    description: "Our AI processes your request and streams LaTeX code in real-time. Review it as it appears, or wait for the complete output.",
  },
  {
    number: "03",
    title: "Auto-compile & Fix",
    description: "The document compiles automatically. If errors occur, the AI self-corrects and retries — up to 3 times — until it works.",
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/app");
    }
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 48px",
          background: "rgba(12, 12, 14, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="var(--accent)" />
            <text
              x="50%"
              y="54%"
              dominantBaseline="middle"
              textAnchor="middle"
              fontSize="13"
              fill="#0c0c0e"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              LV
            </text>
          </svg>
          <span
            style={{
              fontSize: "17px",
              fontWeight: "600",
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
            }}
          >
            LatexV
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            href="/login"
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              fontSize: "14px",
              fontWeight: "500",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              background: "var(--accent)",
              color: "#0c0c0e",
              fontSize: "14px",
              fontWeight: "600",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
          >
            Get started
          </Link>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <section style={{ paddingTop: "140px", paddingBottom: "100px", textAlign: "center" }}>
          <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "100px",
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                marginBottom: "32px",
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--success)",
                  display: "inline-block",
                }}
              />
              AI-powered LaTeX editor
            </div>

            <h1
              style={{
                fontSize: "clamp(40px, 6vw, 64px)",
                fontWeight: "700",
                lineHeight: "1.1",
                letterSpacing: "-1.5px",
                color: "var(--text-primary)",
                marginBottom: "24px",
              }}
            >
              Write LaTeX.
              <br />
              <span style={{ color: "var(--accent)" }}>Let AI compile.</span>
            </h1>

            <p
              style={{
                fontSize: "18px",
                lineHeight: "1.7",
                color: "var(--text-secondary)",
                marginBottom: "48px",
                maxWidth: "560px",
                margin: "0 auto 48px",
              }}
            >
              Describe your document in plain English. Our AI agent generates,
              compiles, and fixes LaTeX — streaming every step in real-time.
            </p>

            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/register"
                style={{
                  padding: "14px 32px",
                  borderRadius: "10px",
                  background: "var(--accent)",
                  color: "#0c0c0e",
                  fontSize: "15px",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                Start for free
              </Link>
              <Link
                href="/login"
                style={{
                  padding: "14px 32px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontSize: "15px",
                  fontWeight: "500",
                  textDecoration: "none",
                }}
              >
                Sign in
              </Link>
            </div>
          </div>

          <div
            style={{
              marginTop: "80px",
              marginLeft: "auto",
              marginRight: "auto",
              maxWidth: "900px",
              padding: "0 24px",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              overflow: "hidden",
              background: "var(--bg-surface)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "6px",
                padding: "12px 16px",
                borderBottom: "1px solid var(--border-subtle)",
                alignItems: "center",
              }}
            >
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f87171" }} />
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#fbbf24" }} />
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#4ade80" }} />
              <span
                style={{
                  marginLeft: "12px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                document.tex
              </span>
            </div>
            <div style={{ padding: "24px", textAlign: "left" }}>
              <pre
                style={{
                  fontSize: "13px",
                  lineHeight: "1.8",
                  color: "var(--text-secondary)",
                  whiteSpace: "pre-wrap",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <span style={{ color: "var(--accent)" }}>% Describe your document</span>
                {"\n"}
                <span style={{ color: "#c084fc" }}>\documentclass</span>
                {"{article}"}
                {"\n\n"}
                <span style={{ color: "#c084fc" }}>\begin</span>
                {"{document}"}
                {"\n"}
                {"  "}
                <span style={{ color: "#c084fc" }}>\section</span>
                {"{Introduction}"}
                {"\n\n"}
                <span style={{ color: "var(--text-secondary)" }}>
                  {"  This is a generated LaTeX document..."}
                </span>
                {"\n\n"}
                <span style={{ color: "#c084fc" }}>\end</span>
                {"{document}"}
              </pre>
            </div>
          </div>
        </section>

        <section style={{ padding: "100px 48px", background: "var(--bg-surface)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <h2 style={{ fontSize: "36px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "16px" }}>
                Features
              </h2>
              <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
                Everything you need to create professional LaTeX documents without the learning curve.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "24px",
              }}
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  style={{
                    padding: "28px",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-base)",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "10px",
                      background: "var(--accent-dim)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "20px",
                      color: "var(--accent)",
                    }}
                  >
                    {feature.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: "17px",
                      fontWeight: "600",
                      color: "var(--text-primary)",
                      marginBottom: "10px",
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "100px 48px" }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <h2 style={{ fontSize: "36px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "16px" }}>
                How it works
              </h2>
              <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
                From idea to compiled PDF in three simple steps.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              {steps.map((step, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    gap: "32px",
                    alignItems: "flex-start",
                    padding: "32px",
                    borderRadius: "16px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-surface)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: "700",
                      color: "var(--accent)",
                      fontFamily: "'JetBrains Mono', monospace",
                      opacity: 0.8,
                      minWidth: "60px",
                    }}
                  >
                    {step.number}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        marginBottom: "8px",
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "15px",
                        lineHeight: "1.6",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          style={{
            padding: "100px 48px",
            background: "linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-base) 100%)",
          }}
        >
          <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: "700",
                color: "var(--text-primary)",
                marginBottom: "20px",
              }}
            >
              Ready to transform your LaTeX workflow?
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "var(--text-secondary)",
                marginBottom: "40px",
                lineHeight: "1.7",
              }}
            >
              Join thousands of researchers, students, and professionals who write better documents faster with LatexV.
            </p>
            <Link
              href="/register"
              style={{
                display: "inline-block",
                padding: "16px 40px",
                borderRadius: "12px",
                background: "var(--accent)",
                color: "#0c0c0e",
                fontSize: "16px",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Get started free
            </Link>
          </div>
        </section>
      </main>

      <footer
        style={{
          padding: "32px 48px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="var(--accent)" />
            <text
              x="50%"
              y="54%"
              dominantBaseline="middle"
              textAnchor="middle"
              fontSize="13"
              fill="#0c0c0e"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              LV
            </text>
          </svg>
          <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>LatexV</span>
        </div>
      </footer>
    </div>
  );
}
