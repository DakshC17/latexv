"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 48px",
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
            LatexVV
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

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 48px", textAlign: "center" }}>
        <div style={{ maxWidth: "680px" }}>
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
              fontSize: "clamp(36px, 5vw, 60px)",
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
              maxWidth: "540px",
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
            width: "100%",
            maxWidth: "900px",
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
              className="mono"
              style={{
                fontSize: "13px",
                lineHeight: "1.8",
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
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
      </main>
    </div>
  );
}
