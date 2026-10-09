import type { Metadata } from "next";
import { Catalog, type CatalogDoc } from "@/components/Catalog";
import { getKnowledge, groups, topics } from "@/lib/data";
import { aiEnabled } from "@/lib/site";

export const metadata: Metadata = {
  title: "หัวข้อ CRM ทั้งหมด",
  description: `${topics.length} หัวข้อ CRM จัดตามวงจรชีวิตลูกค้า ${groups.length} ขั้น ค้นหาด้วยสถานการณ์ที่เจอ แล้วเปิดอ่านแบบถาม-ตอบพร้อม Prompt`,
};

export default function TopicsPage() {
  // Search index built at build time from the book + knowledge layer; only text, no markup.
  const docs: CatalogDoc[] = topics.map((t) => {
    const k = getKnowledge(t.slug);
    return {
      id: t.slug,
      name: t.name,
      en: t.en,
      tldr: k?.tldr ?? t.intro,
      whenYouSay: k?.whenYouSay ?? "",
      concepts: k ? k.concepts.map((c) => `${c.term} ${c.desc}`).join(" ") : "",
      faq: k ? k.faq.map((f) => f.q).join(" ") : "",
      prompts: t.prompts.join(" "),
    };
  });
  return (
    <>
      <div className="page-head">
        <h1>หัวข้อ CRM ทั้งหมด</h1>
        <p>
          ค้นหาด้วยสถานการณ์ที่เจอ หรือกรองตามขั้นของวงจรชีวิตลูกค้า แล้วเปิดอ่านแบบถาม-ตอบ พร้อม KPI ขั้นตอน และ Prompt ต่อยอด
          {aiEnabled && " หรือปรึกษา AI"}
        </p>
      </div>
      <Catalog groups={groups} topics={topics} docs={docs} />
    </>
  );
}
