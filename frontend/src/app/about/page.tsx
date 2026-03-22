"use client";
import Link from "next/link";

export default function About() {
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
          background: "rgba(12, 12, 14, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
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
          <span style={{ fontSize: "17px", fontWeight: "600", color: "var(--text-primary)" }}>
            LatexV
          </span>
        </Link>
        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <Link href="/about" style={{ color: "var(--accent)", fontSize: "14px", fontWeight: "500", textDecoration: "none" }}>
            About
          </Link>
          <Link href="/contact" style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "500", textDecoration: "none" }}>
            Contact
          </Link>
          <Link href="/login" style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "500", textDecoration: "none" }}>
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
            }}
          >
            Get started
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, paddingTop: "120px" }}>
        <section style={{ padding: "80px 48px", maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: "700", color: "var(--text-primary)", marginBottom: "24px", letterSpacing: "-1px" }}>
            About LatexV
          </h1>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginTop: "48px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "16px" }}>
                The Problem
              </h2>
              <p style={{ fontSize: "16px", lineHeight: "1.8", color: "var(--text-secondary)" }}>
                LaTeX is the gold standard for professional documents, but it&apos;s plagued by cryptic errors, complex syntax, and hours of debugging. Even experienced researchers spend more time fighting formatting than writing content.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "16px" }}>
                The Solution
              </h2>
              <p style={{ fontSize: "16px", lineHeight: "1.8", color: "var(--text-secondary)" }}>
                LatexV is an autonomous document generation system. Describe what you need in plain English — our AI agent plans the structure, generates the LaTeX code, compiles it, and self-corrects any errors automatically. No LaTeX knowledge required.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "16px" }}>
                Key Features
              </h2>
              <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "var(--text-secondary)", listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ color: "var(--accent)", fontWeight: "600" }}>—</span>
                  <span>Real-time streaming — watch LaTeX generate character by character</span>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ color: "var(--accent)", fontWeight: "600" }}>—</span>
                  <span>Auto-compilation — documents compile automatically after generation</span>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ color: "var(--accent)", fontWeight: "600" }}>—</span>
                  <span>Self-correction — AI fixes 95% of compilation errors autonomously</span>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ color: "var(--accent)", fontWeight: "600" }}>—</span>
                  <span>Session history — all conversations saved for easy access</span>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ color: "var(--accent)", fontWeight: "600" }}>—</span>
                  <span>Split-pane editor — edit code on left, preview PDF on right</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "16px" }}>
                The Vision
              </h2>
              <p style={{ fontSize: "16px", lineHeight: "1.8", color: "var(--text-secondary)" }}>
                We believe everyone should have access to professional-quality document formatting. LatexV eliminates LaTeX as a barrier, letting researchers, students, and professionals focus on what matters — the content itself.
              </p>
            </div>

            <div style={{ marginTop: "32px", paddingTop: "32px", borderTop: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "16px" }}>
                Built for
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", marginTop: "24px" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>
                    Researchers
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                    Academic papers, theses, grant proposals
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>
                    Students
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                    Dissertations, reports, assignments
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>
                    Professionals
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                    Resumes, technical docs, presentations
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "64px", display: "flex", justifyContent: "center" }}>
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
              Try LatexV free
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
        <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          Built for professional document creation
        </div>
      </footer>
    </div>
  );
}
