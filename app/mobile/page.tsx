import Link from "next/link";
import { MTop } from "@/components/mobile/MTop";
import { WebMcpBadge } from "@/components/WebMcpBadge";
import { changelog, thaiDate } from "@/lib/changelog";
import { allWhatsNew, groups, promptCount, THEME_LABEL, THEMES, topics, topicsIn } from "@/lib/data";

export default function MobileHome() {
  const latest = changelog[0];
  return (
    <>
      <MTop />
      <main className="m-screen">
        <section className="m-hero">
          <h1>เรียนรู้ CRM ทีละขั้นตามวงจรชีวิตลูกค้า</h1>
          <p>
            {topics.length} หัวข้อ · ถาม-ตอบ · {promptCount} prompts ที่คัดลอกไปใช้กับ AI ได้ทันที
          </p>
          <Link href="/mobile/search" className="m-searchpill">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.8 4.8-1.4 1.4-4.8-4.8A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z" fill="currentColor" />
            </svg>
            เล่าสิ่งที่เจอ เช่น ลูกค้าหายไปเงียบ ๆ
          </Link>
          <WebMcpBadge />
        </section>

        {allWhatsNew.length > 0 && (
          <Link href="/mobile/trends" className="m-card m-trends">
            <b>อะไรเปลี่ยนไปในโลก CRM ปี 2025–2026</b>
            <small>{THEMES.filter((th) => allWhatsNew.some((w) => w.theme === th)).map((th) => THEME_LABEL[th]).join(" · ")}</small>
            <span>อ่านเทรนด์ {allWhatsNew.length} เรื่อง ›</span>
          </Link>
        )}

        <h2 className="m-h2">ตอนนี้ทีมคุณกำลังพูดประโยคไหน?</h2>
        <ul className="m-list">
          {groups.map((g) => (
            <li key={g.id} className={`g-${g.id}`}>
              <Link href={`/mobile/g/${g.id}`} className="m-row m-group">
                <span className="m-swatch" />
                <span className="m-row-main">
                  <b>&quot;{g.sentence}&quot;</b>
                  <small>
                    {g.letter}. {g.title} · {topicsIn(g.id).length} หัวข้อ
                  </small>
                </span>
                <span className="m-chev" aria-hidden="true">›</span>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="m-h2">อัปเดตล่าสุด</h2>
        <Link href="/mobile/updates" className="m-card m-latest">
          <time dateTime={latest.date}>{thaiDate(latest.date)}</time>
          <b>{latest.title}</b>
          <span>ดูประวัติการอัปเดตทั้งหมด ›</span>
        </Link>
      </main>
    </>
  );
}
