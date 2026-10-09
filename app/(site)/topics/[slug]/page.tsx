import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Chat } from "@/components/Chat";
import { Faq } from "@/components/Faq";
import { MegaPrompts } from "@/components/MegaPrompts";
import { PromptList } from "@/components/PromptList";
import { getGroup, getKnowledge, getTopic, topics, topicsIn } from "@/lib/data";
import { aiEnabled } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return topics.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = getTopic((await params).slug);
  if (!t) return {};
  const k = getKnowledge(t.slug);
  return { title: `${t.name} (${t.en})`, description: k?.tldr ?? t.intro };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = getTopic((await params).slug);
  if (!t) notFound();
  const group = getGroup(t.group);
  const k = getKnowledge(t.slug);
  const siblings = topicsIn(t.group).filter((x) => x.slug !== t.slug);
  const idx = topics.findIndex((x) => x.slug === t.slug);
  const prev = topics[idx - 1];
  const next = topics[idx + 1];

  const starters = [
    {
      label: "ปรับความรู้เรื่องนี้ให้เข้ากับธุรกิจของฉัน (เติมบริบทก่อนส่ง)",
      prompt: `ช่วยปรับแนวทางเรื่อง ${t.name} ให้เข้ากับธุรกิจของฉัน\nธุรกิจ/อุตสาหกรรม: \nฐานลูกค้า/ช่องทางที่ใช้: \nสถานการณ์ที่เจอ: \nเป้าหมาย: `,
      prefill: true,
    },
    { label: `อธิบาย ${t.en} ให้ทีมที่ไม่ใช่สายการตลาดเข้าใจใน 5 นาที`, prompt: `อธิบาย ${t.name} (${t.en}) แบบง่าย ๆ ให้ทีมที่ไม่ใช่สายการตลาดเข้าใจใน 5 นาที พร้อมตัวอย่างในธุรกิจค้าปลีกไทย 1 ตัวอย่าง` },
    { label: "เขียน Prompt ที่ดีกว่าสำหรับงานที่ฉันจะทำ", prompt: `ฉันจะใช้ AI ช่วยงานเรื่อง ${t.name} ช่วยถามฉัน 3 คำถามเพื่อเก็บบริบท แล้วเขียน Prompt ที่สมบูรณ์ (บทบาท บริบท งาน ข้อจำกัด รูปแบบผลลัพธ์) ให้ฉันเอาไปใช้` },
    { label: "ทีมข้อมูลต้องเตรียมอะไรเพื่อรองรับเรื่องนี้", prompt: `ถ้าจะทำเรื่อง ${t.name} อย่างจริงจัง ทีม Data ต้องเตรียมตาราง ข้อมูล และ pipeline อะไรบ้าง ขอเป็นตาราง: ข้อมูล / แหล่ง / ความถี่ / ใช้ทำอะไร` },
    { label: "ควรทำเรื่องนี้ก่อนหรือหลังหัวข้อไหน", prompt: `${t.name} ควรทำก่อนหรือหลังหัวข้ออื่นในวงจรชีวิตลูกค้า เพื่อให้ได้ผลจริง และวัดผลอย่างไร` },
  ];

  return (
    <div className={`g-${t.group}`}>
      <nav className="crumbs" aria-label="breadcrumb">
        <Link href="/topics">หัวข้อ</Link> / <Link href={`/topics#${group.id}`}>{group.letter}. {group.title}</Link> / {t.name}
      </nav>

      <header className="fw-head">
        <span className="tag">
          <span className="dot" />
          ขั้น {group.letter}. {group.title} — {group.question}
        </span>
        <h1>
          <span className="emoji" aria-hidden="true">
            {t.emoji}
          </span>{" "}
          {t.name}
          <small>{t.en}</small>
        </h1>
        {k && <div className="when">{k.whenYouSay}</div>}
        <p className="how">{k?.tldr ?? t.intro}</p>
        <nav className="jump" aria-label="ไปยังส่วน">
          {k && <a href="#faq">ถาม-ตอบ</a>}
          {k && <a href="#metrics">KPI</a>}
          {k && <a href="#playbook">ขั้นตอน</a>}
          {k && <a href="#mega">Mega Prompt</a>}
          <a href="#prompts">Prompt {t.prompts.length} รายการ</a>
          {aiEnabled && (
            <a href="#ask-ai" className="jump-ai">
              ถาม AI ↓
            </a>
          )}
        </nav>
      </header>

      <div className={aiEnabled ? "fw-layout" : "fw-layout solo"}>
        <article className="fw-main">
          <h2>เรื่องนี้คืออะไร</h2>
          <p className="example">{t.intro}</p>
          <h3 className="sub">ประโยชน์ที่ได้</h3>
          <ul className="benefits">
            {t.benefits.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>

          {k && (
            <>
              <h2>ศัพท์ที่ต้องรู้</h2>
              <dl className="concepts">
                {k.concepts.map((c) => (
                  <div key={c.term}>
                    <dt>{c.term}</dt>
                    <dd>{c.desc}</dd>
                  </div>
                ))}
              </dl>

              <h2 id="faq">ถาม-ตอบ</h2>
              <p className="muted lead">ไล่จากคำถามพื้นฐานไปถึงขั้นสูง ทุกข้อปิดท้ายด้วย Prompt ต่อยอดให้คัดลอกไปถาม AI ต่อ</p>
              <Faq items={k.faq} />

              <h2 id="metrics">KPI ที่ควรวัด</h2>
              <div className="table-wrap">
                <table className="metrics">
                  <thead>
                    <tr>
                      <th>ตัวชี้วัด</th>
                      <th>สูตร</th>
                      <th>ค่าอ้างอิง</th>
                      <th>ทำไมต้องดู</th>
                    </tr>
                  </thead>
                  <tbody>
                    {k.metrics.map((m) => (
                      <tr key={m.name}>
                        <th>{m.name}</th>
                        <td>{m.formula}</td>
                        <td>{m.benchmark}</td>
                        <td>{m.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="playbook">ขั้นตอนลงมือทำ</h2>
              <ol className="steps">
                {k.playbook.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>

              <h2>ข้อผิดพลาดที่พบบ่อย</h2>
              <ul className="pitfalls">
                {k.pitfalls.map((p, i) => (
                  <li key={i}>
                    <b>{p.mistake}</b>
                    <span>{p.fix}</span>
                  </li>
                ))}
              </ul>

              <h2 id="mega">Mega Prompt สำหรับงานใหญ่</h2>
              <p className="muted lead">Prompt แบบเต็ม มีบทบาท บริบท งาน ข้อจำกัด และรูปแบบผลลัพธ์ เติม [ช่องว่าง] แล้วใช้ได้เลย</p>
              <MegaPrompts items={k.advancedPrompts} />
            </>
          )}

          <h2 id="prompts">Prompt {t.prompts.length} รายการจากหนังสือ</h2>
          <p className="muted lead">
            หมายเลข {t.n}.1–{t.n}.{t.prompts.length} ตาม 500 CRM Prompts Book เติม <mark className="ph">[ช่องว่าง]</mark> ให้เป็นบริบทของคุณก่อนส่ง
          </p>
          <PromptList n={t.n} prompts={t.prompts} />

          {k && (
            <>
              <h2>บริบทตลาดไทย</h2>
              <div className="example md">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{k.thaiContext}</ReactMarkdown>
              </div>

              <h2>สิ่งที่ทีมข้อมูลต้องเตรียม</h2>
              <div className="example md data-notes">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{k.dataNotes}</ReactMarkdown>
              </div>

              <h2>แหล่งอ้างอิง</h2>
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

          {siblings.length > 0 && (
            <>
              <h2>หัวข้ออื่นในขั้น &quot;{group.title}&quot;</h2>
              <div className="related">
                {siblings.map((s) => (
                  <Link key={s.slug} href={`/topics/${s.slug}`}>
                    {s.emoji} {s.name}
                    <span>{s.en}</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          <nav className="pager" aria-label="ก่อนหน้า / ถัดไป">
            {prev ? <Link href={`/topics/${prev.slug}`}>← {prev.name}</Link> : <span />}
            {next ? <Link href={`/topics/${next.slug}`}>{next.name} →</Link> : <span />}
          </nav>
        </article>

        {aiEnabled && (
          <Chat
            key={t.slug}
            id="ask-ai"
            variant="side"
            slug={t.slug}
            title="ที่ปรึกษา AI"
            subtitle={`ช่วยนำ ${t.name} ไปใช้กับธุรกิจจริง`}
            intro={`ถามอะไรก็ได้เกี่ยวกับ ${t.name} หรือเล่าสถานการณ์ของคุณให้ช่วยปรับใช้`}
            starters={starters}
          />
        )}
      </div>
    </div>
  );
}
