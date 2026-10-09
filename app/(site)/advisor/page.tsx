import type { Metadata } from "next";
import Link from "next/link";
import { Chat, type Starter } from "@/components/Chat";
import { groups } from "@/lib/data";
import { aiEnabled } from "@/lib/site";

export const metadata: Metadata = {
  title: "ที่ปรึกษา AI",
  description: "เล่าสถานการณ์ CRM ให้ที่ปรึกษา AI ฟัง แล้วรับคำแนะนำว่าควรเริ่มจากหัวข้อไหน พร้อม Prompt ที่ปรับเข้ากับธุรกิจของคุณ",
};

const starters: Starter[] = [
  {
    label: "เล่าสถานการณ์ของฉันเอง (เติมบริบทก่อนส่ง)",
    prompt: "ธุรกิจ/อุตสาหกรรม: \nช่องทางที่ใช้คุยกับลูกค้า: \nสถานการณ์ที่เจอ: \nสิ่งที่ลองไปแล้ว: \nอยากได้อะไรจากการคุยนี้: ",
    prefill: true,
  },
  ...groups.map((g) => ({
    label: `"${g.sentence}"`,
    prompt: `ตอนนี้ทีมของฉันรู้สึกว่า "${g.sentence}" ช่วยถามคำถามเพื่อวินิจฉัยสถานการณ์ แล้วแนะนำหัวข้อที่ควรเริ่ม พร้อม Prompt ต่อยอด`,
    group: g.id,
  })),
];

const scenarios = [
  "ร้านค้าปลีกมีสมาชิก 200,000 คน แต่ซื้อซ้ำแค่ 15%",
  "อยากเริ่มทำ Churn Prediction บน Databricks แต่ไม่รู้ต้องเตรียมข้อมูลอะไร",
  "ส่ง LINE OA broadcast ทุกสัปดาห์ แล้วคนบล็อกเพิ่มขึ้น",
  "ต้องออกแบบ Loyalty Program ใหม่ให้คุ้มทั้งลูกค้าและบริษัท",
  "ฝ่ายการตลาดกับฝ่ายขายเถียงกันว่า Lead คุณภาพไม่ดี",
  "ต้องทำ Dashboard CRM ให้ผู้บริหาร แต่ไม่รู้ควรมี KPI อะไร",
];

export default function AdvisorPage() {
  if (!aiEnabled) {
    return (
      <div className="page-head">
        <h1>ที่ปรึกษา AI</h1>
        <p>เวอร์ชันนี้เป็นเว็บแบบ static จึงยังไม่เปิดใช้ที่ปรึกษา AI ใช้ Prompt ต่อยอดในแต่ละหัวข้อกับ AI ที่คุณมีได้เลย</p>
        <p style={{ marginTop: 16 }}>
          <Link href="/topics" className="btn primary">
            ดูหัวข้อทั้งหมด →
          </Link>
        </p>
      </div>
    );
  }
  return (
    <>
      <div className="page-head">
        <h1>ที่ปรึกษา AI</h1>
        <p>
          ที่ปรึกษา CRM ที่รู้จักทุกหัวข้อในเว็บนี้ เล่าสถานการณ์จริง แล้วจะช่วยวินิจฉัยว่าคุณอยู่ขั้นไหนของวงจรชีวิตลูกค้า แนะนำหัวข้อที่ควรเริ่ม
          และเขียน Prompt ที่ปรับเข้ากับธุรกิจของคุณ
        </p>
      </div>
      <div className="advisor-layout">
        <aside className="advisor-aside">
          <div className="panel">
            <h2>ตัวอย่างสถานการณ์</h2>
            <ul>
              {scenarios.map((s) => (
                <li key={s}>
                  <span className="muted">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <h2>เคล็ดลับให้ได้คำตอบดี</h2>
            <ul className="muted">
              <li>บอกอุตสาหกรรม ขนาดฐานลูกค้า และช่องทางที่ใช้</li>
              <li>บอกว่าลองอะไรไปแล้วและผลเป็นยังไง</li>
              <li>ขอให้ทำเป็นตาราง / เทมเพลต / Prompt ได้เลย</li>
            </ul>
            <Link href="/topics" className="btn" style={{ width: "100%", justifyContent: "center" }}>
              ดูหัวข้อทั้งหมด
            </Link>
          </div>
        </aside>
        <Chat
          title="ที่ปรึกษา CRM"
          subtitle="ผู้เชี่ยวชาญ CRM, Loyalty และ Customer Data"
          intro="เลือกประโยคที่ตรงกับคุณที่สุด หรือพิมพ์เล่าสถานการณ์ได้เลย"
          starters={starters}
        />
      </div>
    </>
  );
}
