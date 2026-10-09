"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { PromptText } from "@/components/PromptText";
import { makeEngine } from "@/lib/search";
import type { Group, GroupId, PromptItem, Topic } from "@/lib/data";

const PAGE = 60;

/** Search, filter and copy any of the 500 prompts in the book. */
export function PromptExplorer({ groups, topics, prompts, mobile = false }: { groups: Group[]; topics: Topic[]; prompts: PromptItem[]; mobile?: boolean }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<GroupId | "all">("all");
  const [limit, setLimit] = useState(PAGE);
  const byTopic = useMemo(() => new Map(topics.map((t) => [t.slug, t])), [topics]);
  const engine = useMemo(() => makeEngine(prompts, ["text"], { text: 1 }), [prompts]);

  const q = query.trim();
  const hits = q ? engine(q) : null;
  const order = hits ? new Map(hits.map((h, i) => [h.id, i])) : null;
  const visible = prompts
    .filter((p) => (active === "all" || p.group === active) && (!order || order.has(p.id)))
    .sort((a, b) => (order ? order.get(a.id)! - order.get(b.id)! : 0));
  const shown = visible.slice(0, limit);

  return (
    <>
      <div className="tools">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="ค้นหา prompt เช่น Email, คูปอง, Churn, Dashboard, PDPA …"
          aria-label="ค้นหา prompt"
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
              onClick={() => {
                setActive(active === g.id ? "all" : g.id);
                setLimit(PAGE);
              }}
            >
              <span className="dot" />
              {g.title}
            </button>
          ))}
        </div>
        <div className="count" aria-live="polite">
          {q || active !== "all" ? `พบ ${visible.length} prompts` : `ทั้งหมด ${prompts.length} prompts ใน ${topics.length} หัวข้อ`}
        </div>
      </div>

      <ol className="prompts all">
        {shown.map((p) => {
          const t = byTopic.get(p.topic)!;
          return (
            <li key={p.id} className={`g-${p.group}`}>
              <span className="pn">{p.id}</span>
              <span className="pt">
                <PromptText text={p.text} />
                <Link href={`${mobile ? "/mobile/t" : "/topics"}/${t.slug}`} className="pt-topic">
                  {t.emoji} {t.name}
                </Link>
              </span>
              <CopyButton text={p.text} />
            </li>
          );
        })}
      </ol>
      {shown.length < visible.length && (
        <p style={{ textAlign: "center" }}>
          <button type="button" className="btn" onClick={() => setLimit(limit + PAGE)}>
            แสดงเพิ่ม ({visible.length - shown.length} รายการ)
          </button>
        </p>
      )}
      {!visible.length && <p className="empty">ไม่พบ prompt ที่ตรงกับคำค้น</p>}
    </>
  );
}
