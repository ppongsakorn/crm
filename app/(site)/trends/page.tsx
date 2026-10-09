import type { Metadata } from "next";
import Link from "next/link";
import { WhatsNew } from "@/components/WhatsNew";
import { allWhatsNew, THEME_LABEL, THEMES } from "@/lib/data";

export const metadata: Metadata = {
  title: "เทรนด์ CRM 2025–2026",
  description: "อะไรเปลี่ยนไปในโลก CRM ปี 2025–2026: AI, Social Media, Marketplace, Live Commerce, แชท, กฎหมาย และข้อมูล พร้อมสิ่งที่ทีม CRM ควรทำ",
};

export default function TrendsPage() {
  const themes = THEMES.filter((th) => allWhatsNew.some((w) => w.theme === th));
  return (
    <>
      <div className="page-head">
        <h1>อะไรเปลี่ยนไปในโลก CRM ปี 2025–2026</h1>
        <p>
          รวมการเปลี่ยนแปลงจาก {new Set(allWhatsNew.map((w) => w.topic.slug)).size} หัวข้อ จัดตามธีม แต่ละข้อบอกว่าอะไรเปลี่ยน ทีม CRM ควรทำอะไร และมีแหล่งอ้างอิงกำกับ
        </p>
      </div>
      <nav className="theme-nav" aria-label="ธีม">
        {themes.map((th) => (
          <a key={th} href={`#${th}`} className={`theme th-${th}`}>
            {THEME_LABEL[th]} <small>{allWhatsNew.filter((w) => w.theme === th).length}</small>
          </a>
        ))}
      </nav>
      {themes.map((th) => (
        <section key={th} id={th} className="trend-group">
          <h2>{THEME_LABEL[th]}</h2>
          <WhatsNew items={allWhatsNew.filter((w) => w.theme === th)} topicHref={(s) => `/topics/${s}`} />
        </section>
      ))}
      {!themes.length && (
        <p className="empty">
          ยังไม่มีข้อมูลเทรนด์ <Link href="/topics">ดูหัวข้อทั้งหมด</Link>
        </p>
      )}
    </>
  );
}
