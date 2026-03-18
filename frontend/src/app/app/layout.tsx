"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 32px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-surface)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Link href="/app" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="6" fill="var(--accent)" />
          <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize="13" fill="#0c0c0e" fontFamily="JetBrains Mono, monospace" fontWeight="700">LV</text>
        </svg>
        <span style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>LatexVV</span>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <Link href="/app" style={{ fontSize: "14px", color: "var(--text-secondary)", textDecoration: "none", fontWeight: "500" }}>Editor</Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--accent-dim)",
              border: "1px solid var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: "600",
              color: "var(--accent)",
            }}
          >
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </nav>
    </header>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <div style={{ width: "24px", height: "24px", border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
