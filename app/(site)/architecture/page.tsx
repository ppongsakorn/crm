import type { Metadata } from "next";
import Link from "next/link";
import { WEBMCP_TOOLS } from "@/lib/webmcp";
import phrases from "@/data/search-phrases.json";
import { groups, promptCount, topics } from "@/lib/data";
import { aiEnabled } from "@/lib/site";

export const metadata: Metadata = {
  title: "สถาปัตยกรรมระบบ",
  description: "เว็บนี้สร้างอย่างไร: ข้อมูล การค้นหาด้วย AI ในเบราว์เซอร์ WebMCP และที่ปรึกษา AI",
};

const phraseCount = Object.values(phrases as Record<string, string[]>).reduce((n, l) => n + l.length, 0);

const TOOL_ROWS: Record<(typeof WEBMCP_TOOLS)[number], [string, string]> = {
  search_topics: ["สถานการณ์เป็นภาษาคน", "หัวข้อที่ตรง พร้อมวลีที่ตรงและ URL (ใช้ระบบค้นคำ + คลังวลีในเบราว์เซอร์)"],
  list_topics: ["ขั้น (ไม่บังคับ)", "หัวข้อทั้ง 25 พร้อมสรุปหนึ่งบรรทัด"],
  get_topic: ["slug", "สรุป ประโยชน์ ศัพท์ KPI ขั้นตอน ข้อผิดพลาด บริบทไทย สิ่งที่ทีมข้อมูลต้องเตรียม แหล่งอ้างอิง"],
  get_faq: ["slug", "ถาม-ตอบทุกข้อ พร้อม Prompt ต่อยอด"],
  get_prompts: ["slug", "Prompt 20 รายการจากหนังสือ + Mega Prompt"],
  open_topic: ["slug", "เปิดหน้าหัวข้อนั้นในแท็บนี้"],
};

export default function ArchitecturePage() {
  return (
    <div className="arch">
      <div className="page-head">
        <h1>สถาปัตยกรรมระบบ</h1>
        <p>เว็บนี้สร้างอย่างไร ข้อมูลมาจากไหน ค้นหาทำงานอย่างไร และ AI agent ในเบราว์เซอร์เรียกใช้เว็บเป็นเครื่องมือได้อย่างไร</p>
      </div>

      <dl className="arch-stats">
        <div>
          <dt>ขั้นของวงจรชีวิตลูกค้า</dt>
          <dd>{groups.length}</dd>
        </div>
        <div>
          <dt>หัวข้อ</dt>
          <dd>{topics.length}</dd>
        </div>
        <div>
          <dt>Prompt จากหนังสือ</dt>
          <dd>{promptCount}</dd>
        </div>
        <div>
          <dt>วลีสถานการณ์สำหรับค้นหา</dt>
          <dd>{phraseCount}</dd>
        </div>
        <div>
          <dt>เครื่องมือ WebMCP</dt>
          <dd>{WEBMCP_TOOLS.length}</dd>
        </div>
      </dl>

      <h2>ข้อมูล</h2>
      <p>
        แหล่งข้อมูลมี 2 ชั้น ชั้นแรกคือ <code>data/crm.json</code> ที่ parse จาก <em>500 CRM Prompts Book</em> (9 ขั้น 25 หัวข้อ 500 prompt) ชั้นที่สองคือ{" "}
        <code>data/knowledge/&lt;slug&gt;.json</code> หัวข้อละไฟล์ เป็นผลจากการค้นคว้าเพิ่ม (ถาม-ตอบ KPI ขั้นตอน ข้อผิดพลาด Mega Prompt บริบทไทย สิ่งที่ทีมข้อมูลต้องเตรียม แหล่งอ้างอิง)
        ทุกหน้า render เป็น static ตอน build จึงโหลดเร็วและเปิดได้แม้ไม่มี server
      </p>

      <h2 id="search">ค้นหาด้วย AI ในเบราว์เซอร์</h2>
      <p>
        ช่องค้นหาในหน้า <Link href="/topics">หัวข้อ</Link> รับ &quot;สถานการณ์&quot; ไม่ใช่คีย์เวิร์ด และทำงานทั้งหมดในเบราว์เซอร์ของผู้ใช้ ไม่ส่งข้อความไปที่ server ใด ๆ ประกอบด้วย 3 ชั้นที่รวมอันดับกันด้วย Reciprocal Rank Fusion:
      </p>
      <ul className="arch-decisions">
        <li>
          <b>1. ค้นคำแบบมีอันดับ</b>
          <span>ตัดคำไทยด้วย Intl.Segmenter แล้วจัดอันดับ BM25 (MiniSearch) ชื่อหัวข้อและประโยค &quot;เมื่อทีมพูดว่า&quot; มีน้ำหนักมากกว่าเนื้อหา</span>
        </li>
        <li>
          <b>2. คลังวลีสถานการณ์</b>
          <span>หัวข้อละ 30–40 ประโยคที่คนมักพิมพ์เมื่อติดเรื่องนั้น ({phraseCount} วลี) ผลลัพธ์จะบอกว่า &quot;ตรงกับ&quot; วลีไหน</span>
        </li>
        <li>
          <b>3. ค้นตามความหมาย</b>
          <span>
            โมเดล embedding หลายภาษา (multilingual-e5-small ตัดคลังคำให้เหลือเฉพาะไทย/อังกฤษ ราว 35MB) รันใน Web Worker ด้วย Transformers.js โหลดเงียบ ๆ หลังหน้าเว็บนิ่ง ระหว่างโหลดยังค้นได้ตามปกติ
            เวกเตอร์ของหัวข้อ คำถามถาม-ตอบ และวลีทั้งหมดคำนวณไว้ล่วงหน้าตอน build
          </span>
        </li>
      </ul>

      <h2 id="webmcp">WebMCP</h2>
      <p>
        ทุกหน้าลงทะเบียนเครื่องมือแบบอ่านอย่างเดียว {WEBMCP_TOOLS.length} ตัวผ่าน <code>document.modelContext</code> ตามร่างมาตรฐาน WebMCP (W3C WebML CG) เพื่อให้ AI agent ในเบราว์เซอร์ที่รองรับ
        เรียกใช้เว็บนี้เป็นเครื่องมือได้โดยตรง ทดสอบได้ใน Edge Canary/Dev หรือ Chrome Canary ที่เปิด flag WebMCP แล้วดูที่ DevTools → Application → WebMCP เบราว์เซอร์ทั่วไปไม่ได้รับผลกระทบ
      </p>
      <div className="arch-table">
        <table>
          <thead>
            <tr>
              <th>เครื่องมือ</th>
              <th>รับ</th>
              <th>คืน</th>
            </tr>
          </thead>
          <tbody>
            {WEBMCP_TOOLS.map((t) => (
              <tr key={t}>
                <th scope="row">{t}</th>
                <td>{TOOL_ROWS[t][0]}</td>
                <td>{TOOL_ROWS[t][1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="mobile">แอปมือถือ</h2>
      <p>
        <Link href="/mobile">/mobile</Link> เป็นหน้าจอแยกสำหรับมือถือโดยเฉพาะ มี top bar แท็บล่าง หน้าค้นหาเต็มจอ และหน้าหัวข้อแบบแท็บ ไม่ใช่แค่ย่อหน้าเดสก์ท็อปให้พอดีจอ เมื่อเปิดหน้าเดสก์ท็อปบนจอ ≤ 760px สคริปต์เล็ก ๆ จะสลับไปหน้าแอปที่ตรงกันก่อน render
        และถ้าผู้ใช้เลือก &quot;เว็บเต็ม&quot; จะจำค่านั้นไว้ ค้นหา AI และ WebMCP ทำงานเหมือนกันทั้งสองมุมมอง
      </p>

      <h2>ที่ปรึกษา AI</h2>
      <p>
        {aiEnabled
          ? "โหมด server: /api/chat ส่ง system prompt ที่มีแคตตาล็อกทั้ง 25 หัวข้อ (byte-identical ทุกครั้งเพื่อใช้ prompt caching) ไปยัง Claude ผ่าน Claude API หรือ Microsoft Foundry แล้ว stream คำตอบกลับ มี rate limit ต่อ IP"
          : "เวอร์ชัน static นี้ปิดที่ปรึกษา AI เพราะไม่มี server สำหรับ /api/chat เมื่อ deploy แบบ Node/Docker จะเปิดให้อัตโนมัติ"}
      </p>

      <h2>โครงสร้างโค้ด</h2>
      <pre className="arch-tree">{`app/(site)/        หน้าแรก · topics · topics/[slug] ×${topics.length} · prompts · advisor · updates · architecture
app/mobile/        แอปมือถือ: หน้าแรก · search · prompts · updates · g/[group] · t/[slug]
app/api/chat/      endpoint stream คำตอบ (เฉพาะโหมด server)
components/        Catalog (ค้นหา) · Faq · MegaPrompts · PromptList · Chat · WebMcp · WebMcpBadge
lib/search/        tokenize · lexical (BM25 + วลี) · semantic · worker · RRF
data/              crm.json · knowledge/*.json · search-phrases.json · changelog.json
scripts/           build-knowledge · fetch/build search model · build-search-index · eval-search
tests/             ตรวจข้อมูล + ชุดคำค้นที่ติดป้ายคำตอบ`}</pre>
    </div>
  );
}
