import type { Metadata } from "next";
import { PromptExplorer } from "@/components/PromptExplorer";
import { allPrompts, groups, promptCount, topics } from "@/lib/data";

export const metadata: Metadata = {
  title: `Prompt ทั้ง ${promptCount} รายการ`,
  description: `ค้นหาและคัดลอก prompt CRM ทั้ง ${promptCount} รายการจาก 500 CRM Prompts Book จัดตาม ${topics.length} หัวข้อ`,
};

export default function PromptsPage() {
  return (
    <>
      <div className="page-head">
        <h1>Prompt ทั้ง {promptCount} รายการ</h1>
        <p>
          ทุก prompt มี <mark className="ph">[ช่องว่าง]</mark> ให้เติมบริบทของธุรกิจคุณก่อนส่งให้ AI กดคัดลอกแล้วไปวางใน ChatGPT, Claude หรือ Gemini ได้เลย
          อยากได้ prompt ที่ลึกกว่านี้ ดู &quot;Mega Prompt&quot; ในหน้าของแต่ละหัวข้อ
        </p>
      </div>
      <PromptExplorer groups={groups} topics={topics} prompts={allPrompts} />
    </>
  );
}
