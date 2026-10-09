"use client";

import { useEffect, useMemo, useState } from "react";
import { TopicCard } from "@/components/TopicCard";
import { makeEngine } from "@/lib/search";
import type { Group, GroupId, Topic } from "@/lib/data";
import { aiEnabled } from "@/lib/site";

export interface CatalogDoc {
  id: string;
  name: string;
  en: string;
  tldr: string;
  whenYouSay: string;
  concepts: string;
  faq: string;
  prompts: string;
}

export function Catalog({ groups, topics, docs }: { groups: Group[]; topics: Topic[]; docs: CatalogDoc[] }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<GroupId | "all">("all");
  const engine = useMemo(
    () =>
      makeEngine(docs, ["name", "en", "whenYouSay", "tldr", "concepts", "faq", "prompts"], {
        name: 5,
        en: 4,
        whenYouSay: 4,
        tldr: 3,
        concepts: 2,
        faq: 1,
        prompts: 1,
      }),
    [docs],
  );
  const meta = useMemo(() => new Map(docs.map((d) => [d.id, d])), [docs]);

  // Deep links like /topics#retain (from the home page) preselect a stage.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (groups.some((g) => g.id === id)) setActive(id as GroupId);
  }, [groups]);

  const q = query.trim();
  const hits = q ? engine(q) : null;
  const order = hits ? new Map(hits.map((h, i) => [h.id, i])) : null;
  const visible = topics
    .filter((t) => (active === "all" || t.group === active) && (!order || order.has(t.slug)))
    .sort((a, b) => (order ? order.get(a.slug)! - order.get(b.slug)! : 0));

  return (
    <>
      <div className="tools">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="พิมพ์สิ่งที่เจอ เช่น ลูกค้าหาย, คูปอง, PDPA, ต่ออายุ, NPS …"
          aria-label="ค้นหาหัวข้อ CRM"
        />
        <div className="filters" role="group" aria-label="กรองตามขั้น">
          <button type="button" className="filter" aria-pressed={active === "all"} onClick={() => setActive("all")}>
            ทั้งหมด
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`filter g-${g.id}`}
              aria-pressed={active === g.id}
              onClick={() => setActive(active === g.id ? "all" : g.id)}
            >
              <span className="dot" />
              {g.title}
            </button>
          ))}
        </div>
        <div className="count" aria-live="polite">
          {q
            ? `${visible.length} หัวข้อที่เกี่ยวข้อง เรียงตามความใกล้เคียง`
            : active !== "all"
              ? `พบ ${visible.length} หัวข้อ`
              : `ทั้งหมด ${topics.length} หัวข้อ ใน ${groups.length} ขั้น`}
        </div>
      </div>

      {q ? (
        <section className="results">
          <div className="grid">
            {visible.map((t) => (
              <TopicCard key={t.slug} topic={t} tldr={meta.get(t.slug)?.tldr} whenYouSay={meta.get(t.slug)?.whenYouSay} />
            ))}
          </div>
        </section>
      ) : (
        groups.map((g) => {
          const items = visible.filter((t) => t.group === g.id);
          if (!items.length) return null;
          return (
            <section key={g.id} id={g.id} className={`group g-${g.id}`}>
              <header>
                <h2>
                  <span className="letter">{g.letter}</span> {g.title}
                </h2>
                <span className="q">{g.question}</span>
              </header>
              <p className="why">{g.why}</p>
              <div className="grid">
                {items.map((t) => (
                  <TopicCard key={t.slug} topic={t} tldr={meta.get(t.slug)?.tldr} whenYouSay={meta.get(t.slug)?.whenYouSay} />
                ))}
              </div>
            </section>
          );
        })
      )}
      {!visible.length && (
        <p className="empty">
          ไม่พบหัวข้อที่ตรงกับคำค้น ลองใช้คำอื่นที่อธิบายสถานการณ์
          {aiEnabled && " หรือเล่าให้ที่ปรึกษา AI ฟัง"}
        </p>
      )}
    </>
  );
}
