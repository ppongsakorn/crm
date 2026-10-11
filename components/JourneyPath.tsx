"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FillablePrompt } from "@/components/FillablePrompt";
import { JourneyMap, type StageState } from "@/components/JourneyMap";
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
 * The starter path as an adventure: a drawn map of eight stages on top, then
 * one quest card per stage. Visitors pick their business type
 * (shows type-specific advice) and tick actions off; both are remembered in
 * this browser only.
 */
export function JourneyPath({ path, topics, tools = {}, mobile = false }: { path: Path; topics: Record<string, TopicRef>; tools?: Record<string, ToolRef>; mobile?: boolean }) {
  const [type, setType] = useState<BusinessType | null>(null);
  const [done, setDone] = useState<Record<string, number[]>>({});
  const [open, setOpen] = useState<Set<string>>(() => new Set([path.steps[0].id]));

  useEffect(() => {
    try {
      const t = localStorage.getItem(TYPE_KEY);
      if (t === "online" || t === "store" || t === "service") setType(t);
      const d = localStorage.getItem(DONE_KEY);
      const saved: Record<string, number[]> = d ? JSON.parse(d) : {};
      setDone(saved);
      // open the stage the visitor is on
      const cur = path.steps.find((s) => (saved[s.id]?.length ?? 0) < s.doThis.length);
      if (cur) setOpen(new Set([cur.id]));
    } catch {}
  }, [path.steps]);

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
  const cleared = path.steps.filter(isDone).length;
  const stageState = (id: string): StageState => {
    const s = path.steps.find((x) => x.id === id)!;
    return isDone(s) ? "done" : id === current ? "current" : "ahead";
  };
  const stageProgress = (id: string) => {
    const s = path.steps.find((x) => x.id === id)!;
    return (done[id]?.length ?? 0) / s.doThis.length;
  };
  const setCard = (id: string, isOpen: boolean) =>
    setOpen((prev) => {
      if (prev.has(id) === isOpen) return prev;
      const next = new Set(prev);
      if (isOpen) next.add(id);
      else next.delete(id);
      return next;
    });
  const goTo = (id: string) => {
    setCard(id, true);
    requestAnimationFrame(() => document.getElementById(`step-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const topicHref = (slug: string) => (mobile ? `/mobile/t/${slug}` : `/topics/${slug}`);
  const toolsHref = (id: string) => (mobile ? `/mobile/tools#${id}` : `/tools#${id}`);
  // A starting business: show options that fit a small shop and, if chosen, its type.
  const fits = (v: ToolRef["vendors"][number]) => (v.size.includes("micro") || v.size.includes("sme")) && (!type || v.types.includes(type));

  return (
    <div className={`journey${mobile ? " mobile" : ""}`}>
      <JourneyMap steps={path.steps} state={stageState} progress={stageProgress} onPick={goTo} mobile={mobile} />
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
            ผ่าน {cleared}/{path.steps.length} ด่าน · ภารกิจสำเร็จ {finished}/{total}
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
            <li key={s.id} className={`journey-step g-${s.stage}${complete ? " complete" : ""}${s.id === current ? " current" : ""}`}>
              <span className="journey-dot" aria-hidden="true">
                {complete ? "✓" : n + 1}
              </span>
              <details id={`step-${s.id}`} open={open.has(s.id)} onToggle={(e) => setCard(s.id, e.currentTarget.open)} className="journey-card">
                <summary>
                  <span className="journey-place">
                    <b>ด่าน {n + 1} · {s.place}</b> · {s.when}
                  </span>
                  <b>{s.title}</b>
                  <span className="journey-goal">{s.goal}</span>
                  <span className="journey-stage-bar" aria-hidden="true">
                    <i style={{ width: `${Math.round(stageProgress(s.id) * 100)}%` }} />
                  </span>
                </summary>
                <div className="journey-body">
                  <div className="journey-cols">
                    <section>
                      <h3>อุปสรรคที่จะเจอ</h3>
                      <ul className="journey-face">
                        {s.youWillFace.map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <h3>ภารกิจ (ติ๊กเมื่อทำแล้ว)</h3>
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
                    <b>ยังไม่ต้องแบกไป</b> {s.skipForNow}
                  </p>
                  <p className="journey-ready">
                    <b>ผ่านด่านเมื่อ</b> {s.readyWhen}
                  </p>

                  <h3>คู่มือที่ควรอ่าน</h3>
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
                      <h3>อุปกรณ์ติดตัว: เครื่องมือที่ใช้ในด่านนี้</h3>
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

                  <h3>Prompt ประจำด่าน</h3>
                  <FillablePrompt text={s.prompt} block />

                  {complete && n + 1 < path.steps.length && (
                    <p className="journey-cleared">
                      ผ่านด่านนี้แล้ว ด่านถัดไปคือ{" "}
                      <a
                        href={`#step-${path.steps[n + 1].id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          goTo(path.steps[n + 1].id);
                        }}
                      >
                        {path.steps[n + 1].place} ›
                      </a>
                    </p>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ol>
      {cleared === path.steps.length && (
        <div className="journey-win" role="status">
          <b>พิชิตปีแรกครบทุกด่านแล้ว</b>
          ตอนนี้คุณมีฐานลูกค้า รู้ว่าใครคือลูกค้าประจำ และตัดสินใจจากตัวเลขได้ ปีที่ 2 ลองต่อยอดด้วย <Link href={topicHref("churn-prediction")}>การคาดการณ์ลูกค้าที่จะหายไป</Link> และ{" "}
          <Link href={topicHref("renewal-subscription-management")}>การต่ออายุสมาชิก</Link>
        </div>
      )}
    </div>
  );
}
