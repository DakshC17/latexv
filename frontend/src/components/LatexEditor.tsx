"use client";
import { useMemo } from "react";

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function LatexEditor({ value, onChange, disabled, style }: LatexEditorProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      spellCheck={false}
      style={{
        width: "100%",
        height: "100%",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        lineHeight: "1.7",
        color: "var(--text-primary)",
        background: "var(--bg-surface)",
        padding: "16px",
        borderRadius: "8px",
        border: "1px solid var(--border)",
        resize: "none",
        outline: "none",
        margin: 0,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflowY: "auto",
        ...style
      }}
    />
  );
}
