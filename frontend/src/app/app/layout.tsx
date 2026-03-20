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

  const getInitials = (email: string | undefined) => {
    if (!email) return "U";
    const name = email.split("@")[0];
    return name[0].toUpperCase();
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "16px 32px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-surface)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Link href="/app" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", marginRight: "auto", paddingLeft: "40px" }}>
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="6" fill="var(--accent)" />
          <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize="13" fill="#0c0c0e" fontFamily="JetBrains Mono, monospace" fontWeight="700">LV</text>
        </svg>
        <span style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>LatexV</span>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "var(--accent-dim)",
            border: "1px solid var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: "600",
            color: "var(--accent)",
            cursor: "default",
          }}
          title={user?.email}
        >
          {getInitials(user?.email)}
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
