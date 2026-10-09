"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WEBMCP_TOOLS } from "@/lib/webmcp";

/** "WebMCP" chip. The nine-colour border spins and the status turns green when the browser exposes document.modelContext. */
export function WebMcpBadge({ compact }: { compact?: boolean }) {
  const [active, setActive] = useState(false);
  const n = WEBMCP_TOOLS.length;
  useEffect(() => {
    const d = document as Document & { modelContext?: unknown };
    const nav = navigator as Navigator & { modelContext?: unknown };
    setActive(!!(d.modelContext ?? nav.modelContext));
  }, []);
  return (
    <Link
      href="/architecture#webmcp"
      className={`webmcp${active ? " on" : ""}${compact ? " compact" : ""}`}
      title={active ? `เบราว์เซอร์นี้รองรับ WebMCP — AI agent เรียกใช้เครื่องมือของหน้านี้ได้ ${n} ตัว` : "หน้านี้เปิดเครื่องมือให้ AI agent ในเบราว์เซอร์ตามร่างมาตรฐาน WebMCP"}
      aria-label={active ? `WebMCP active, ${n} tools` : "WebMCP ready"}
    >
      <svg className="webmcp-ic" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="4" cy="10" r="2.4" />
        <circle cx="16" cy="4.5" r="2.4" />
        <circle cx="16" cy="15.5" r="2.4" />
        <path d="M6.2 9 13.8 5.4M6.2 11l7.6 3.6" />
      </svg>
      <span className="webmcp-name">WebMCP</span>
      <span className="webmcp-state">
        <i aria-hidden="true" />
        {active ? `LIVE · ${n} TOOLS` : "READY"}
      </span>
    </Link>
  );
}
