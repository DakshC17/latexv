"use client";
import { useMemo, useRef, useEffect } from "react";

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  isStreaming?: boolean;
  autoScroll?: boolean;
}

export default function LatexEditor({ 
  value, 
  onChange, 
  disabled, 
  style, 
  isStreaming = false,
  autoScroll = false 
}: LatexEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll effect when content changes during streaming
  useEffect(() => {
    if (autoScroll && isStreaming && textareaRef.current) {
      const textarea = textareaRef.current;
      
      // Scroll to bottom with smooth animation
      textarea.scrollTop = textarea.scrollHeight;
      
      // Alternative method for better browser compatibility
      textarea.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end',
        inline: 'nearest' 
      });
    }
  }, [value, autoScroll, isStreaming]);

  return (
    <textarea
      ref={textareaRef}
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
        scrollBehavior: isStreaming ? "smooth" : "auto",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflowY: "auto",
        ...style,
      }}
    />
  );
}
