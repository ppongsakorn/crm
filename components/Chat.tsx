"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { basePath } from "@/lib/site";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

export interface Starter {
  label: string;
  prompt: string;
  group?: string;
  /** Put the prompt in the input for the user to complete instead of sending it. */
  prefill?: boolean;
}

const mdComponents: Components = {
  a: ({ href = "", children }) =>
    href.startsWith("/") ? (
      <Link href={href}>{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  table: ({ children }) => (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  ),
};

function storageKey(slug?: string) {
  return `crm-advisor-chat:${slug ?? "general"}`;
}

export function Chat({
  id,
  slug,
  title,
  subtitle,
  starters,
  intro,
  variant = "full",
}: {
  id?: string;
  slug?: string;
  title: string;
  subtitle: string;
  starters: Starter[];
  intro: string;
  variant?: "full" | "side";
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Per-viewer convenience only: keep the conversation across reloads in this tab.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey(slug));
      if (saved) setTurns(JSON.parse(saved));
    } catch {}
  }, [slug]);
  useEffect(() => {
    if (busy) return;
    try {
      sessionStorage.setItem(storageKey(slug), JSON.stringify(turns));
    } catch {}
  }, [turns, busy, slug]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    // Drop a trailing assistant error/empty turn so roles keep alternating.
    const history = turns.filter((t, i) => !(i === turns.length - 1 && t.role === "assistant" && !t.content));
    const next: Turn[] = [...history, { role: "user", content }];
    setTurns([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let answer = "";
    const show = (s: string) =>
      setTurns((prev) => [...prev.slice(0, -1), { role: "assistant", content: s }]);
    try {
      const res = await fetch(`${basePath}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, slug }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        show(`⚠️ ${err.error ?? "เกิดข้อผิดพลาด"}`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        show(answer);
      }
      if (!answer.trim()) show("⚠️ ไม่ได้รับคำตอบ กรุณาลองใหม่");
    } catch (e) {
      if ((e as Error).name !== "AbortError") show(answer + "\n\n⚠️ การเชื่อมต่อขาดหาย กรุณาลองใหม่");
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function reset() {
    abortRef.current?.abort();
    setTurns([]);
    setBusy(false);
  }

  return (
    <section id={id} className={`chat ${variant}`} aria-label={title}>
      <div className="chat-head">
        <div className="avatar" aria-hidden="true">AI</div>
        <div>
          <b>{title}</b>
          <small>{subtitle}</small>
        </div>
        {turns.length > 0 && (
          <button type="button" onClick={reset}>
            เริ่มใหม่
          </button>
        )}
      </div>

      <div className="chat-body" ref={bodyRef} aria-live="polite">
        {turns.length === 0 && (
          <div className="starters">
            <p>{intro}</p>
            {starters.map((s) => (
              <button key={s.label} type="button" className={`starter${s.group ? ` g-${s.group}` : ""}`} onClick={() => {
                  if (!s.prefill) return send(s.prompt);
                  setInput(s.prompt);
                  inputRef.current?.focus();
                }}
              >
                {s.group && <span className="dot" />}
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        )}
        {turns.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="msg user">
              {t.content}
            </div>
          ) : (
            <div key={i} className="msg assistant">
              {t.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {t.content}
                </ReactMarkdown>
              ) : (
                <span className="thinking">
                  <i />
                  <i />
                  <i /> กำลังคิดคำตอบ…
                </span>
              )}
            </div>
          ),
        )}
      </div>

      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={input.includes("\n") ? 4 : 1}
          maxLength={8000}
          placeholder="เล่าสถานการณ์ หรือถามคำถาม…"
          aria-label="ข้อความถึงที่ปรึกษา AI"
        />
        <button type="submit" disabled={busy || !input.trim()}>
          ส่ง
        </button>
      </form>
      <div className="chat-note">AI อาจผิดพลาดได้ ใช้เป็นข้อมูลประกอบการตัดสินใจ · อย่าใส่ข้อมูลลับหรือข้อมูลส่วนบุคคล</div>
    </section>
  );
}
