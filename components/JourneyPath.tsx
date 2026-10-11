"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FillablePrompt } from "@/components/FillablePrompt";
import type { BusinessType, JourneyPath as Path } from "@/lib/paths";
import { TIER_LABEL, type ToolRef } from "@/lib/vendorMeta";

export interface TopicRef {
  slug: string;
  name: string;
  emoji: string;
  group: string;
}

const TYPE_KEY = "crm-path-type";
const DONE_KEY = "crm-path-done";

/**
 * The starter path as a vertical timeline. Visitors pick their business type
 * (shows type-specific advice) and tick actions off; both are remembered in
 * this browser only.
 */
export function JourneyPath({ path, topics, tools = {}, mobile = false }: { path: Path; topics: Record<string, TopicRef>; tools?: Record<string, ToolRef>; mobile?: boolean }) {
  const [type, setType] = useState<BusinessType | null>(null);
  const [done, setDone] = useState<Record<string, number[]>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem(TYPE_KEY);
      if (t === "online" || t === "store" || t === "service") setType(t);
      const d = localStorage.getItem(DONE_KEY);
      if (d) setDone(JSON.parse(d));
    } catch {}
    setLoaded(true);
  }, []);

  const pickType = (t: BusinessType | null) => {
    setType(t);
    try {
      if (t) localStorage.setItem(TYPE_KEY, t);
      else localStorage.removeItem(TYPE_KEY);
    } catch {}
  };
  const toggle = (step: string, i: number) => {
    const cur = new Set(done[step] ?? []);
    if (cur.has(i)) cur.delete(i);
    else cur.add(i);
    const next = { ...done, [step]: [...cur].sort((a, b) => a - b) };
    setDone(next);
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify(next));
    } catch {}
  };

  const total = path.steps.reduce((n, s) => n + s.doThis.length, 0);
  const finished = path.steps.reduce((n, s) => n + (done[s.id]?.length ?? 0), 0);
  const isDone = (s: Path["steps"][number]) => (done[s.id]?.length ?? 0) >= s.doThis.length;
  const current = path.steps.find((s) => !isDone(s))?.id;
  const topicHref = (slug: string) => (mobile ? `/mobile/t/${slug}` : `/topics/${slug}`);
  const toolsHref = (id: string) => (mobile ? `/mobile/tools#${id}` : `/tools#${id}`);
  // A starting business: show options that fit a small shop and, if chosen, its type.
  const fits = (v: ToolRef["vendors"][number]) => (v.size.includes("micro") || v.size.includes("sme")) && (!type || v.types.includes(type));

  return (
    <div className={`journey${mobile ? " mobile" : ""}`}>
      <section className="journey-setup">
        <div className="journey-types" role="group" aria-label="ประเภทธุรกิจของคุณ">
          <span className="journey-label">ธุรกิจของคุณเป็นแบบไหน</span>
          {path.businessTypes.map((b) => (
            <button key={b.id} type="button" aria-pressed={type === b.id} onClick={() => pickType(type === b.id ? null : b.id)} title={b.desc}>
              {b.label}
            </button>
          ))}
        </div>
        <div className="journey-progress" aria-live="polite">
          <div className="bar">
            <i style={{ width: `${total ? Math.round((finished / total) * 100) : 0}%` }} />
          </div>
          <span>
            ทำแล้ว {finished}/{total} ข้อ
            {finished > 0 && (
              <button
                type="button"
                className="profile-clear"
                onClick={() => {
                  setDone({});
                  try {
                    localStorage.removeItem(DONE_KEY);
                  } catch {}
                }}
              >
                เริ่มนับใหม่
              </button>
            )}
          </span>
        </div>
      </section>

      <ol className="journey-steps">
        {path.steps.map((s, n) => {
          const complete = isDone(s);
          return (
            <li key={s.id} className={`journey-step${complete ? " complete" : ""}${s.id === current ? " current" : ""}`}>
              <span className="journey-dot" aria-hidden="true">
                {complete ? "✓" : n + 1}
              </span>
              <details open={!loaded ? n === 0 : s.id === current} className="journey-card">
                <summary>
                  <span className="journey-when">{s.when}</span>
                  <b>{s.title}</b>
                  <span className="journey-goal">{s.goal}</span>
                </summary>
                <div className="journey-body">
                  <div className="journey-cols">
                    <section>
                      <h3>จะเจออะไร</h3>
                      <ul className="journey-face">
                        {s.youWillFace.map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <h3>ควรทำ</h3>
                      <ul className="journey-todo">
                        {s.doThis.map((x, i) => (
                          <li key={i}>
                            <label>
                              <input type="checkbox" checked={done[s.id]?.includes(i) ?? false} onChange={() => toggle(s.id, i)} />
                              <span>{x}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  <div className="journey-type">
                    {type ? (
                      <>
                        <b>สำหรับ{path.businessTypes.find((b) => b.id === type)?.label}</b> {s.byType[type]}
                      </>
                    ) : (
                      path.businessTypes.map((b) => (
                        <p key={b.id}>
                          <b>{b.label}:</b> {s.byType[b.id]}
                        </p>
                      ))
                    )}
                  </div>

                  <p className="journey-skip">
                    <b>ยังไม่ต้องทำ</b> {s.skipForNow}
                  </p>
                  <p className="journey-ready">
                    <b>พร้อมไปขั้นถัดไปเมื่อ</b> {s.readyWhen}
                  </p>

                  <h3>อ่านต่อ</h3>
                  <div className="journey-topics">
                    {s.topics.map((slug) => {
                      const t = topics[slug];
                      return t ? (
                        <Link key={slug} href={topicHref(slug)} className={`chip g-${t.group}`}>
                          {t.emoji} {t.name}
                        </Link>
                      ) : null;
                    })}
                  </div>

                  {s.tools && s.tools.some((x) => tools[x.category]) && (
                    <>
                      <h3>เครื่องมือที่ใช้ในขั้นนี้</h3>
                      <div className="journey-tools">
                        {s.tools.map((x) => {
                          const c = tools[x.category];
                          if (!c) return null;
                          const vs = c.vendors.filter(fits);
                          const rows = (["th", "intl"] as const).map((o) => [o, vs.filter((v) => v.origin === o).slice(0, mobile ? 3 : 4)] as const);
                          return (
                            <div key={x.category} className="journey-tool">
                              <b>{c.name}</b>
                              <p>{x.why}</p>
                              {rows.map(([o, list]) =>
                                list.length ? (
                                  <div key={o} className="jt-row">
                                    <span>{o === "th" ? "ในประเทศ" : "ต่างประเทศ"}</span>
                                    {list.map((v) => (
                                      <a key={v.name} className="jt-vendor" href={v.url} target="_blank" rel="noopener noreferrer nofollow">
                                        {v.name}
                                        <small>{TIER_LABEL[v.priceTier]}</small>
                                      </a>
                                    ))}
                                  </div>
                                ) : null,
                              )}
                              <div className="jt-row">
                                <Link className="jt-more" href={toolsHref(c.id)}>
                                  เทียบทั้ง {c.count} ราย พร้อมราคาและข้อควรรู้ ›
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <h3>Prompt สำหรับขั้นนี้</h3>
                  <FillablePrompt text={s.prompt} block />
                </div>
              </details>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
