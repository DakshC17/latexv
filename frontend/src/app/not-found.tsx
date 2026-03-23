"use client";
import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 24px",
      textAlign: "center"
    }}>
      <div style={{ marginBottom: "24px" }}>
        <span style={{ 
          fontSize: "80px", 
          fontWeight: "700", 
          color: "var(--accent)",
          fontFamily: "'JetBrains Mono', monospace",
          opacity: 0.6
        }}>
          404
        </span>
      </div>
      
      <h1 style={{ 
        fontSize: "24px", 
        fontWeight: "600", 
        color: "var(--text-primary)", 
        marginBottom: "12px" 
      }}>
        Page not found
      </h1>
      
      <p style={{ 
        fontSize: "16px", 
        color: "var(--text-secondary)", 
        marginBottom: "40px",
        maxWidth: "400px",
        lineHeight: "1.6"
      }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      
      <div style={{ display: "flex", gap: "16px" }}>
        <Link
          href="/"
          style={{
            padding: "12px 28px",
            borderRadius: "10px",
            background: "var(--accent)",
            color: "#0c0c0e",
            fontSize: "15px",
            fontWeight: "600",
            textDecoration: "none",
          }}
        >
          Go home
        </Link>
        <Link
          href="/register"
          style={{
            padding: "12px 28px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            fontSize: "15px",
            fontWeight: "500",
            textDecoration: "none",
          }}
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
