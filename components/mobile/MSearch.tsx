"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SemanticStatus } from "@/components/SemanticStatus";
import { useSearch } from "@/components/useSearch";
import type { Topic } from "@/lib/data";
import type { SearchDoc } from "@/lib/search/types";
import { assetBase } from "@/lib/site";

const EXAMPLES = [
  "ลูกค้าหายไปเงียบ ๆ",
  "ส่ง LINE แล้วคนบล็อก",
  "สมาชิกไม่ต่ออายุ",
  "ข้อมูลลูกค้าซ้ำซ้อน",
  "ทำการตลาดให้ถูก PDPA",
  "ฝ่ายขายกับการตลาดทะเลาะกัน",
];

/** Full-screen situation search: the field sits at the top, results are tappable rows. */
export function MSearch({ topics, docs }: { topics: Topic[]; docs: SearchDoc[] }) {
  const [query, setQuery] = useState("");
  const { hits, semState, progress } = useSearch(docs, query, assetBase);
  const bySlug = useMemo(() => new Map(topics.map((t) => [t.slug, t])), [topics]);
  const meta = useMemo(() => new Map(docs.map((d) => [d.slug, d])), [docs]);
  const q = query.trim();
  const rows = q && hits ? hits.slice(0, 12).map((h) => ({ t: bySlug.get(h.slug)!, why: h.why })).filter((r) => r.t) : [];

  return (
    <>
      <header className="m-top m-searchbar">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="เล่าสิ่งที่เจอ…"
          aria-label="ค้นหาหัวข้อ CRM จากสถานการณ์"
          autoFocus
          enterKeyHint="search"
        />
        {query && (
          <button type="button" className="m-clear" onClick={() => setQuery("")}>
            ล้าง
          </button>
        )}
      </header>
      <main className="m-screen">
        {!q && (
          <>
            <p className="m-lead">พิมพ์สถานการณ์ที่เจอด้วยภาษาตัวเอง หรือแตะตัวอย่าง</p>
            <div className="m-chips">
              {EXAMPLES.map((e) => (
                <button key={e} type="button" className="m-chip" onClick={() => setQuery(e)}>
                  {e}
                </button>
              ))}
            </div>
          </>
        )}
        {q && (
          <p className="m-status" aria-live="polite">
            <SemanticStatus state={semState} progress={progress} />
          </p>
        )}
        {q && hits && !rows.length && <p className="m-lead">ไม่พบหัวข้อที่ตรง ลองเล่าด้วยคำอื่น</p>}
        {rows.length > 0 && (
          <ul className="m-list">
            {rows.map(({ t, why }) => (
              <li key={t.slug} className={`g-${t.group}`}>
                <Link href={`/mobile/t/${t.slug}`} className="m-row">
                  <span className="m-swatch" />
                  <span className="m-row-main">
                    <b>
                      {t.emoji} {t.name}
                    </b>
                    <small>{meta.get(t.slug)?.when ? `“${meta.get(t.slug)!.when}”` : meta.get(t.slug)?.tldr}</small>
                    {why && <small className="m-why">ตรงกับ “{why}”</small>}
                  </span>
                  <span className="m-chev" aria-hidden="true">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
