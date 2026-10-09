"use client";

import type { SemanticState } from "@/components/useSearch";
import type { LoadProgress } from "@/lib/search/browser";

export function SemanticStatus({ state, progress }: { state: SemanticState; progress: LoadProgress | null }) {
  if (state === "idle") return null;
  if (state === "ready") return <span className="sem ok">ค้นตามความหมาย: พร้อม</span>;
  if (state === "error") return <span className="sem err">ค้นตามความหมายใช้ไม่ได้ในเบราว์เซอร์นี้ — แสดงผลค้นคำแทน</span>;
  return (
    <span className="sem">
      กำลังเตรียมค้นตามความหมาย
      {progress && progress.total > 0 && ` ${Math.min(99, Math.round((progress.loaded / progress.total) * 100))}%`} — ระหว่างนี้ค้นได้ตามปกติ
    </span>
  );
}
