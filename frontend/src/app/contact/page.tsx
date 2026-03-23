"use client";
import { useState } from "react";
import Link from "next/link";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }
    
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setStatus("sending");
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setStatus("sent");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

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
        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <Link href="/about" style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "500", textDecoration: "none" }}>About</Link>
          <Link href="/contact" style={{ color: "var(--accent)", fontSize: "14px", fontWeight: "500", textDecoration: "none" }}>Contact</Link>
          <Link href="/login" style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "500", textDecoration: "none" }}>Sign in</Link>
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

      <main style={{ flex: 1, paddingTop: "120px", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", padding: "0 24px" }}>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: "700", color: "var(--text-primary)", marginBottom: "16px", textAlign: "center" }}>
            Get in touch
          </h1>
          <p style={{ fontSize: "16px", color: "var(--text-secondary)", textAlign: "center", marginBottom: "48px", lineHeight: "1.7" }}>
            Have a question or feedback? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
          </p>

          <div
            className="contact-form"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "48px",
            }}
          >
            {status === "sent" ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "var(--success-dim)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>
                  Message sent
                </h2>
                <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  style={{
                    marginTop: "24px",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div>
                  <label htmlFor="name" style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: `1px solid ${errors.name ? "var(--error)" : "var(--border)"}`,
                      background: "var(--bg-base)",
                      color: "var(--text-primary)",
                      fontSize: "15px",
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => {
                      if (!errors.name) e.target.style.borderColor = "var(--accent)";
                    }}
                    onBlur={(e) => {
                      if (!errors.name) e.target.style.borderColor = "var(--border)";
                    }}
                  />
                  {errors.name && (
                    <p style={{ fontSize: "13px", color: "var(--error)", marginTop: "6px" }}>{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: `1px solid ${errors.email ? "var(--error)" : "var(--border)"}`,
                      background: "var(--bg-base)",
                      color: "var(--text-primary)",
                      fontSize: "15px",
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => {
                      if (!errors.email) e.target.style.borderColor = "var(--accent)";
                    }}
                    onBlur={(e) => {
                      if (!errors.email) e.target.style.borderColor = "var(--border)";
                    }}
                  />
                  {errors.email && (
                    <p style={{ fontSize: "13px", color: "var(--error)", marginTop: "6px" }}>{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="subject" style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: `1px solid ${errors.subject ? "var(--error)" : "var(--border)"}`,
                      background: "var(--bg-base)",
                      color: "var(--text-primary)",
                      fontSize: "15px",
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => {
                      if (!errors.subject) e.target.style.borderColor = "var(--accent)";
                    }}
                    onBlur={(e) => {
                      if (!errors.subject) e.target.style.borderColor = "var(--border)";
                    }}
                  />
                  {errors.subject && (
                    <p style={{ fontSize: "13px", color: "var(--error)", marginTop: "6px" }}>{errors.subject}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Your message..."
                    rows={6}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: `1px solid ${errors.message ? "var(--error)" : "var(--border)"}`,
                      background: "var(--bg-base)",
                      color: "var(--text-primary)",
                      fontSize: "15px",
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "inherit",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => {
                      if (!errors.message) e.target.style.borderColor = "var(--accent)";
                    }}
                    onBlur={(e) => {
                      if (!errors.message) e.target.style.borderColor = "var(--border)";
                    }}
                  />
                  {errors.message && (
                    <p style={{ fontSize: "13px", color: "var(--error)", marginTop: "6px" }}>{errors.message}</p>
                  )}
                </div>

                {status === "error" && (
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "8px",
                      background: "var(--error-dim)",
                      color: "var(--error)",
                      fontSize: "14px",
                      textAlign: "center",
                    }}
                  >
                    Something went wrong. Please try again.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  style={{
                    padding: "14px 28px",
                    borderRadius: "10px",
                    background: status === "sending" ? "var(--text-muted)" : "var(--accent)",
                    color: "#0c0c0e",
                    fontSize: "15px",
                    fontWeight: "600",
                    border: "none",
                    cursor: status === "sending" ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: status === "sending" ? 0.6 : 1,
                  }}
                >
                  {status === "sending" ? "Sending..." : "Send message"}
                </button>
              </form>
            )}
          </div>

          <div style={{ marginTop: "48px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "12px" }}>
              Prefer email?
            </p>
            <a
              href="mailto:quantumbyte.co.in@gmail.com"
              style={{
                fontSize: "15px",
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              quantumbyte.co.in@gmail.com
            </a>
          </div>
        </div>
      </main>

      <footer style={{ padding: "32px 48px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="var(--accent)" />
              <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize="13" fill="#0c0c0e" fontFamily="JetBrains Mono, monospace" fontWeight="700">LV</text>
            </svg>
            <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>LatexV</span>
          </div>
          
          <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
            <Link href="/about" style={{ color: "var(--text-muted)", fontSize: "14px", textDecoration: "none" }}>About</Link>
            <Link href="/contact" style={{ color: "var(--text-muted)", fontSize: "14px", textDecoration: "none" }}>Contact</Link>
            <Link href="/terms" style={{ color: "var(--text-muted)", fontSize: "14px", textDecoration: "none" }}>Terms</Link>
            <Link href="/privacy" style={{ color: "var(--text-muted)", fontSize: "14px", textDecoration: "none" }}>Privacy</Link>
          </div>
          
          <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            Built for professional documents
          </div>
        </div>
      </footer>
    </div>
  );
}
