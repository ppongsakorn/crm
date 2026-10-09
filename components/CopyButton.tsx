"use client";

import { useEffect, useState } from "react";

/** Copies `text` to the clipboard and confirms for a moment. */
export function CopyButton({ text, label = "คัดลอก", className = "copy" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(t);
  }, [done]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
    } catch {
      // Clipboard blocked (http, permissions): fall back to a selectable prompt.
      window.prompt("คัดลอกข้อความนี้", text);
    }
  }
  return (
    <button type="button" className={className} onClick={copy} aria-live="polite">
      {done ? "คัดลอกแล้ว ✓" : label}
    </button>
  );
}
