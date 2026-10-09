import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Faq } from "@/components/Faq";
import { WhatsNew } from "@/components/WhatsNew";
import { MegaPrompts } from "@/components/MegaPrompts";
import { MTabs } from "@/components/mobile/MTabs";
import { MTop } from "@/components/mobile/MTop";
import { PromptList } from "@/components/PromptList";
import { getGroup, getKnowledge, getTopic, thaiMonth, topics, topicsIn, unquote } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return topics.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = getTopic((await params).slug);
  return t ? { title: t.name } : {};
}

export default async function MobileTopic({ params }: { params: Promise<{ slug: string }> }) {
  const t = getTopic((await params).slug);
  if (!t) notFound();
  const group = getGroup(t.group);
  const k = getKnowledge(t.slug);
  const siblings = topicsIn(t.group);
  const i = siblings.findIndex((x) => x.slug === t.slug);
  const prev = siblings[i - 1];
  const next = siblings[i + 1];

  const tabs = [
    ...(k
      ? [
          { id: "faq", label: `ถาม-ตอบ ${k.faq.length}`, content: <Faq items={k.faq} /> },
          ...(k.whatsNew?.length
            ? [{ id: "news", label: "ใหม่ 2025–26", content: <WhatsNew items={k.whatsNew} /> }]
            : []),
          {
            id: "steps",
            label: "ขั้นตอน",
            content: (
              <>
                <ol className="m-steps">
                  {k.playbook.map((s, n) => (
                    <li key={n}>{s}</li>
                  ))}
                </ol>
                <h2 className="m-h2">ข้อผิดพลาดที่พบบ่อย</h2>
                <ul className="pitfalls">
                  {k.pitfalls.map((p, n) => (
                    <li key={n}>
                      <b>{p.mistake}</b>
                      <span>{p.fix}</span>
                    </li>
                  ))}
                </ul>
              </>
            ),
          },
          {
            id: "kpi",
            label: "KPI",
            content: (
              <ul className="m-kpis">
                {k.metrics.map((m) => (
                  <li key={m.name}>
                    <b>{m.name}</b>
                    <dl>
                      <dt>สูตร</dt>
                      <dd>{m.formula}</dd>
                      <dt>ค่าอ้างอิง</dt>
                      <dd>{m.benchmark}</dd>
                      <dt>ทำไมต้องดู</dt>
                      <dd>{m.why}</dd>
                    </dl>
                  </li>
                ))}
              </ul>
            ),
          },
          { id: "mega", label: "Mega Prompt", content: <MegaPrompts items={k.advancedPrompts} /> },
        ]
      : []),
    {
      id: "prompts",
      label: `Prompt ${t.prompts.length}`,
      content: (
        <>
          <p className="m-hint">
            หมายเลข {t.n}.1–{t.n}.{t.prompts.length} ตาม 500 CRM Prompts Book เติม <mark className="ph">[ช่องว่าง]</mark> ก่อนส่ง
          </p>
          <PromptList n={t.n} prompts={t.prompts} />
        </>
      ),
    },
    {
      id: "about",
      label: "ศัพท์ & บริบท",
      content: (
        <>
          <p className="m-example">{t.intro}</p>
          <h2 className="m-h2">ประโยชน์ที่ได้</h2>
          <ul className="benefits">
            {t.benefits.map((b, n) => (
              <li key={n}>{b}</li>
            ))}
          </ul>
          {k && (
            <>
              <h2 className="m-h2">ศัพท์ที่ต้องรู้</h2>
              <dl className="concepts">
                {k.concepts.map((c) => (
                  <div key={c.term}>
                    <dt>{c.term}</dt>
                    <dd>{c.desc}</dd>
                  </div>
                ))}
              </dl>
              <h2 className="m-h2">บริบทตลาดไทย</h2>
              <div className="m-example md">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{k.thaiContext}</ReactMarkdown>
              </div>
              <h2 className="m-h2">สิ่งที่ทีมข้อมูลต้องเตรียม</h2>
              <div className="m-example md data-notes">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{k.dataNotes}</ReactMarkdown>
              </div>
              <h2 className="m-h2">แหล่งอ้างอิง</h2>
              <ul className="sources">
                {k.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                    <span>{s.note}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <div className={`g-${t.group}`}>
      <MTop back={{ href: `/mobile/g/${group.id}`, label: group.title }} />
      <main className="m-screen m-fw">
        <header className="m-head">
          <span className="m-tag">
            <span className="m-dot" />
            {group.letter}. {group.title}
          </span>
          <h1>
            {t.emoji} {t.name}
            <small>{t.en}</small>
          </h1>
          {k && (
            <p className="m-when">
              <b>เมื่อทีมพูดว่า</b> “{unquote(k.whenYouSay)}”
            </p>
          )}
          <p className="m-how">{k?.tldr ?? t.intro}</p>
          {k?.updatedAt && <p className="m-stamp">ปรับปรุงล่าสุด {thaiMonth(k.updatedAt)}</p>}
        </header>
        <MTabs tabs={tabs} />
        <nav className="m-pager" aria-label="ก่อนหน้า / ถัดไป">
          {prev ? (
            <Link href={`/mobile/t/${prev.slug}`}>
              <small>ก่อนหน้า</small>‹ {prev.name}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/mobile/t/${next.slug}`} className="next">
              <small>ถัดไป</small>
              {next.name} ›
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </main>
    </div>
  );
}
