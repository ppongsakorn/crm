"use client";

import { useEffect, useMemo, useState } from "react";
import { SemanticStatus } from "@/components/SemanticStatus";
import { TopicCard } from "@/components/TopicCard";
import { useSearch } from "@/components/useSearch";
import type { Group, GroupId, Topic } from "@/lib/data";
import type { SearchDoc } from "@/lib/search/types";
import { aiEnabled, assetBase } from "@/lib/site";

const RESULT_LIMIT = 12;

export function Catalog({ groups, topics, docs }: { groups: Group[]; topics: Topic[]; docs: SearchDoc[] }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<GroupId | "all">("all");
  const { hits, semState, progress } = useSearch(docs, query, assetBase);
  const bySlug = useMemo(() => new Map(topics.map((t) => [t.slug, t])), [topics]);
  const meta = useMemo(() => new Map(docs.map((d) => [d.slug, d])), [docs]);

  // Deep links like /topics#retain (from the home page) preselect a stage.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (groups.some((g) => g.id === id)) setActive(id as GroupId);
  }, [groups]);

  const inGroup = (t: Topic) => active === "all" || t.group === active;
  // Only for the first few ms of the very first query; show nothing rather than the full list.
  const pending = query.trim() !== "" && hits === null;
  const ranked = hits !== null || pending;
  const visible = ranked
    ? (hits ?? []).map((h) => ({ t: bySlug.get(h.slug)!, why: h.why })).filter((r) => r.t && inGroup(r.t)).slice(0, RESULT_LIMIT)
    : topics.filter(inGroup).map((t) => ({ t, why: undefined }));

  return (
    <>
      <div className="tools">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="เล่าสิ่งที่เจอ เช่น ลูกค้าหายไปเงียบ ๆ, ส่ง LINE แล้วคนบล็อก, อยากทำ loyalty ใหม่ …"
          aria-label="ค้นหาหัวข้อ CRM จากสถานการณ์"
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
          {pending
            ? " "
            : ranked
              ? `${visible.length} หัวข้อที่เกี่ยวข้องที่สุด เรียงตามความใกล้เคียง`
              : active !== "all"
                ? `พบ ${visible.length} หัวข้อ`
                : `ทั้งหมด ${topics.length} หัวข้อ ใน ${groups.length} ขั้น`}
          {" "}
          <SemanticStatus state={semState} progress={progress} />
        </div>
      </div>

      {ranked ? (
        <section className="results">
          <div className="grid">
            {visible.map(({ t, why }) => (
              <TopicCard key={t.slug} topic={t} tldr={meta.get(t.slug)?.tldr} whenYouSay={meta.get(t.slug)?.when} why={why} />
            ))}
          </div>
        </section>
      ) : (
        groups.map((g) => {
          const items = visible.filter((r) => r.t.group === g.id);
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
                {items.map(({ t }) => (
                  <TopicCard key={t.slug} topic={t} tldr={meta.get(t.slug)?.tldr} whenYouSay={meta.get(t.slug)?.when} />
                ))}
              </div>
            </section>
          );
        })
      )}
      {!visible.length && !pending && (
        <p className="empty">
          ไม่พบหัวข้อที่ตรงกับคำค้น ลองใช้คำอื่นที่อธิบายสถานการณ์
          {aiEnabled && " หรือเล่าให้ที่ปรึกษา AI ฟัง"}
        </p>
      )}
    </>
  );
}
