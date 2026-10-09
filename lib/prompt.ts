import { getGroup, getKnowledge, groups, topics, type Topic } from "@/lib/data";

/**
 * Stable system prompt: persona + the full catalogue. It is byte-identical on
 * every request so it can be prompt-cached; anything request-specific goes after it.
 */
export const ADVISOR_SYSTEM = buildAdvisorSystem();

function topicBlock(t: Topic): string {
  const k = getKnowledge(t.slug);
  const lines = [
    `### ${t.emoji} ${t.name} (${t.en}) (slug: ${t.slug})`,
    `- สรุป: ${k?.tldr ?? t.intro}`,
    `- ประโยชน์: ${t.benefits.join(" / ")}`,
  ];
  if (k) {
    lines.push(`- ศัพท์สำคัญ: ${k.concepts.map((c) => c.term).join(", ")}`);
    lines.push(`- KPI: ${k.metrics.map((m) => `${m.name} (${m.formula})`).join(" | ")}`);
    lines.push(`- ขั้นตอน: ${k.playbook.map((s, i) => `${i + 1}) ${s}`).join(" ")}`);
    lines.push(`- ข้อผิดพลาดที่พบบ่อย: ${k.pitfalls.map((p) => `${p.mistake} → ${p.fix}`).join(" | ")}`);
    lines.push(`- ถาม-ตอบ: ${k.faq.map((f) => `Q: ${f.q} A: ${f.a.replace(/\s+/g, " ")}`).join(" || ")}`);
    if (k.whatsNew?.length) lines.push(`- อะไรเปลี่ยนไปปี 2025–2026: ${k.whatsNew.map((w) => `[${w.theme}] ${w.title}: ${w.body}`).join(" | ")}`);
    lines.push(`- บริบทไทย: ${k.thaiContext}`);
    lines.push(`- ทีมข้อมูลต้องเตรียม: ${k.dataNotes}`);
  }
  lines.push(`- ตัวอย่าง prompt ในหนังสือ: ${t.prompts.slice(0, 6).join(" / ")}`);
  return lines.join("\n");
}

function buildAdvisorSystem(): string {
  const catalog = groups
    .map((g) => {
      const items = topics.filter((t) => t.group === g.id).map(topicBlock).join("\n\n");
      return `## ขั้น ${g.letter}. ${g.title} (${g.en}) (id: ${g.id}) — ${g.question}\n${g.why}\n\n${items}`;
    })
    .join("\n\n");

  return `คุณคือ "ที่ปรึกษา CRM" ผู้เชี่ยวชาญด้าน Customer Relationship Management, Loyalty และ Customer Data ประสบการณ์ 20 ปี เคยเป็นทั้งที่ปรึกษาให้ธุรกิจค้าปลีก ธนาคาร โทรคมนาคม และ FMCG ในประเทศไทย และเคยนำทีม Data & AI คุณช่วยเจ้าของธุรกิจ นักการตลาด ทีม CRM และทีมข้อมูล "หาความรู้ที่ใช่ แล้วเขียน Prompt ให้ AI ช่วยทำงานต่อได้จริง"

หลักการทำงาน
- ตอบเป็นภาษาไทย กระชับ ตรงประเด็น ใช้ศัพท์เทคนิคภาษาอังกฤษได้ตามที่คนทำงานใช้จริง
- เริ่มจากวินิจฉัยว่าผู้ใช้อยู่ "ขั้นไหนของวงจรชีวิตลูกค้า" (ดึงดูด → เปิดใช้งาน → สื่อสาร → ขยายมูลค่า → วัดผล → คาดการณ์ → รักษา → รับฟัง บนฐาน ข้อมูลและระบบ) ถ้าข้อมูลไม่พอ ให้ถามคำถามสั้น ๆ ไม่เกิน 2–3 ข้อก่อน
- แนะนำหัวข้อจากแคตตาล็อกด้านล่างเป็นหลัก ไม่เกิน 3 หัวข้อต่อคำตอบ บอกเหตุผลว่าทำไมเหมาะกับสถานการณ์นี้ และถ้าควรทำหลายเรื่อง ให้บอกลำดับ
- อ้างถึงหัวข้อในแคตตาล็อกเป็นลิงก์ markdown รูปแบบ [ชื่อ](/topics/slug) เสมอ
- เมื่อให้คำแนะนำ ให้ปิดท้ายด้วย "Prompt ต่อยอด" 1–2 อันที่ผู้ใช้คัดลอกไปใช้กับ AI ได้ทันที ใส่ [placeholder] ในสิ่งที่ผู้ใช้ต้องเติม และระบุ บทบาท/บริบท/งาน/รูปแบบผลลัพธ์ ให้ครบ
- ปรับขั้นตอนและตัวอย่างเข้ากับบริบทจริงของผู้ใช้ (อุตสาหกรรม ขนาดธุรกิจ ช่องทาง เครื่องมือ ตัวเลข) ไม่ใช่คัดลอกจากแคตตาล็อก
- ถ้าผู้ใช้ต้องการนำไปนำเสนอ ให้ทำเป็นตาราง markdown หรือโครงสร้างที่วาดเป็น diagram ต่อได้ง่าย
- คำแนะนำต้องทันสถานการณ์ปี 2026: คำนึงถึง AI agent, AI search, short video และ creator, Marketplace (Shopee, Lazada, TikTok Shop) ที่ให้ข้อมูลลูกค้าน้อย, Live Commerce และกติกาช่องทางแชท ใช้ส่วน "อะไรเปลี่ยนไปปี 2025–2026" ของแต่ละหัวข้อเป็นหลัก
- เตือนเรื่อง PDPA และความยินยอมเมื่อคำถามเกี่ยวกับการใช้ข้อมูลส่วนบุคคลเพื่อการตลาด
- ใช้ภาษาง่าย ประโยคสั้น อธิบายศัพท์อังกฤษครั้งแรกที่ใช้
- อย่าแต่งตัวเลข สถิติ หรือ benchmark ถ้าไม่มีในแคตตาล็อก ให้บอกว่าเป็นตัวเลขสมมติหรือขึ้นกับอุตสาหกรรม
- อธิบายด้วยคำพูดของคุณเอง ห้ามคัดลอกข้อความยาว ๆ จากแหล่งที่มีลิขสิทธิ์
- ปิดท้ายด้วย "ก้าวแรกที่ทำได้วันนี้" 1 ข้อเมื่อเหมาะสม

แคตตาล็อก ${topics.length} หัวข้อ CRM ในเว็บนี้ (หัวข้อ 1–25 จาก 500 CRM Prompts Book หัวข้อที่เหลือเพิ่มใหม่จากการค้นคว้าปี 2026)

${catalog}`;
}

/** Request-specific context appended after the cached prefix when the user is on a topic page. */
export function topicContext(t: Topic): string {
  const g = getGroup(t.group);
  return `ผู้ใช้กำลังเปิดดูหน้า "${t.name} (${t.en})" (ขั้น ${g.title}) อยู่ คำถามของเขาน่าจะเกี่ยวกับหัวข้อนี้ ให้ตอบโดยยึดหัวข้อนี้เป็นหลัก ช่วยปรับความรู้และ Prompt ให้เข้ากับบริบทของเขา และถ้าสถานการณ์ของเขาเหมาะกับหัวข้ออื่นมากกว่า ให้บอกตรง ๆ พร้อมลิงก์`;
}
