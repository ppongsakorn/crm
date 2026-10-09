import type { Metadata } from "next";
import { Catalog } from "@/components/Catalog";
import { groups, topics } from "@/lib/data";
import { searchDocs } from "@/lib/searchDocs";
import { aiEnabled } from "@/lib/site";

export const metadata: Metadata = {
  title: "หัวข้อ CRM ทั้งหมด",
  description: `${topics.length} หัวข้อ CRM จัดตามวงจรชีวิตลูกค้า ${groups.length} ขั้น ค้นหาด้วยสถานการณ์ที่เจอ แล้วเปิดอ่านแบบถาม-ตอบพร้อม Prompt`,
};

export default function TopicsPage() {
  return (
    <>
      <div className="page-head">
        <h1>หัวข้อ CRM ทั้งหมด</h1>
        <p>
          ค้นหาด้วยสถานการณ์ที่เจอ หรือกรองตามขั้นของวงจรชีวิตลูกค้า แล้วเปิดอ่านแบบถาม-ตอบ พร้อม KPI ขั้นตอน และ Prompt ต่อยอด
          {aiEnabled && " หรือปรึกษา AI"}
        </p>
      </div>
      <Catalog groups={groups} topics={topics} docs={searchDocs} />
    </>
  );
}
