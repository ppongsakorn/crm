"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { fillPrompt, placeholders, segments } from "@/lib/prompts";

/**
 * A prompt with its [placeholders] filled from the visitor's business details,
 * an inline form for the rest, and a copy button that copies the filled text.
 */
export function FillablePrompt({ text, block, children }: { text: string; block?: boolean; children?: React.ReactNode }) {
  const { profile, custom, setCustom } = useProfile();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const segs = segments(text, profile, custom);
  const all = placeholders(text);
  const { prompt, missing } = fillPrompt(text, profile, custom);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      window.prompt("คัดลอกข้อความนี้", prompt);
    }
  }

  const body = segs.map((s, i) =>
    s.placeholder ? (
      <mark key={i} className={s.filled ? "ph filled" : "ph"} title={s.filled ? `[${s.placeholder}]` : undefined}>
        {s.text}
      </mark>
    ) : (
      <span key={i}>{s.text}</span>
    ),
  );

  return (
    <div className={`fp${block ? " block" : ""}`}>
      {block ? <pre className="fp-text">{body}</pre> : <span className="fp-text">{body}</span>}
      {children}
      <div className="fp-actions">
        {all.length > 0 && (
          <button type="button" className="copy fill" aria-expanded={open} onClick={() => setOpen(!open)}>
            {missing.length ? `เติมช่องว่าง (${missing.length})` : "แก้ช่องที่เติม"}
          </button>
        )}
        <button type="button" className="copy" onClick={copy} aria-live="polite">
          {copied ? "คัดลอกแล้ว ✓" : missing.length < all.length ? "คัดลอกแบบเติมแล้ว" : "คัดลอก"}
        </button>
      </div>
      {open && (
        <div className="fp-form">
          {all.map((ph) => (
            <label key={ph}>
              <span>{ph}</span>
              <input
                value={custom[ph] ?? ""}
                placeholder={segs.find((s) => s.placeholder === ph && s.filled)?.text ?? "พิมพ์ค่าของคุณ"}
                onChange={(e) => setCustom(ph, e.target.value)}
              />
            </label>
          ))}
          <p>ค่าที่กรอกจะถูกจำไว้ และเติมให้ prompt อื่นที่มีช่องเดียวกันด้วย</p>
        </div>
      )}
    </div>
  );
}
