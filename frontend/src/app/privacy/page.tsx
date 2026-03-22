"use client";
import Link from "next/link";

export default function Privacy() {
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
            <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize="13" fill="#0c0c0e" fontFamily="JetBrains Mono, monospace" fontWeight="700">LV</text>
          </svg>
          <span style={{ fontSize: "17px", fontWeight: "600", color: "var(--text-primary)" }}>LatexV</span>
        </Link>
      </header>

      <main style={{ flex: 1, paddingTop: "120px", paddingBottom: "80px" }}>
        <article style={{ maxWidth: "720px", margin: "0 auto", padding: "0 48px" }}>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: "700", color: "var(--text-primary)", marginBottom: "16px" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "48px" }}>
            Last updated: March 23, 2026
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px", color: "var(--text-secondary)", fontSize: "15px", lineHeight: "1.8" }}>
            <section>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>Information We Collect</h2>
              <p>We collect information you provide directly: email address, password (hashed), and document content you generate. We also collect usage data like API requests and session information.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>How We Use Information</h2>
              <p>Your information is used to provide the service, maintain your account, generate documents, and improve our platform. Document content is processed to generate your PDFs and is not shared with third parties.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>Data Storage</h2>
              <p>Account data is stored in PostgreSQL. Documents and PDFs are stored in Supabase Storage. Session tokens are stored in Redis with 24-hour expiration. All data is encrypted in transit and at rest.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>Cookies</h2>
              <p>We use HTTP-only cookies for session management. These cookies are essential for authentication and do not track you across websites. They expire after 24 hours or when you log out.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>Third-Party Services</h2>
              <p>We use Google Gemini API for document generation, Supabase for database and storage, and Upstash for session management. Each has their own privacy policies.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>Data Retention</h2>
              <p>Account data is retained until you delete your account. Documents are retained as long as your account is active. You can request deletion of your data at any time.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>Your Rights</h2>
              <p>You have the right to access, update, or delete your personal information. Contact us at privacy@latexv.com for any data-related requests.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>Security</h2>
              <p>We implement industry-standard security measures including encryption, secure password hashing (bcrypt), and regular security reviews.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>Contact</h2>
              <p>Questions about privacy? Email us at privacy@latexv.com</p>
            </section>
          </div>
        </article>
      </main>

      <footer style={{ padding: "32px 48px", borderTop: "1px solid var(--border-subtle)", textAlign: "center" }}>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>LatexV - Built for professional document creation</p>
      </footer>
    </div>
  );
}
