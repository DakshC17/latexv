import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "LatexV - AI-Powered LaTeX Document Generation",
  description: "Generate, compile, and fix LaTeX documents using AI. Describe what you need in plain English. Auto-correction included.",
  keywords: ["LaTeX", "document generation", "AI writing", "PDF compilation", "academic papers", "research papers", "resume builder"],
  authors: [{ name: "LatexV" }],
  openGraph: {
    title: "LatexV - AI-Powered LaTeX Document Generation",
    description: "Generate, compile, and fix LaTeX documents using AI. No LaTeX knowledge required.",
    type: "website",
    locale: "en_US",
    siteName: "LatexV",
  },
  twitter: {
    card: "summary_large_image",
    title: "LatexV - AI-Powered LaTeX Document Generation",
    description: "Generate, compile, and fix LaTeX documents using AI. No LaTeX knowledge required.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
