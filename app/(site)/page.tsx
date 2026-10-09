import Link from "next/link";
import { groups, promptCount, topics, topicsIn, type GroupId } from "@/lib/data";
import { aiEnabled, basePath } from "@/lib/site";
import { changelog, thaiDate } from "@/lib/changelog";

const RING = groups.filter((g) => g.id !== "data");
const CORE = groups.find((g) => g.id === "data")!;
const SHORT: Record<GroupId, string> = {
  attract: "ดึงดูด",
  activate: "เปิดใช้งาน",
  engage: "สื่อสาร",
  grow: "ขยายมูลค่า",
  measure: "วัดผล",
  predict: "คาดการณ์",
  retain: "รักษา",
  listen: "รับฟัง",
  data: "ข้อมูล & ระบบ",
};

/** Eight equal ring sectors clockwise from 12 o'clock, around the data core. */
function sector(i: number, n: number, r0: number, r1: number) {
  const a0 = ((i * 360) / n - 90) * (Math.PI / 180);
  const a1 = (((i + 1) * 360) / n - 90) * (Math.PI / 180);
  const p = (a: number, r: number) => `${(200 + r * Math.cos(a)).toFixed(1)} ${(200 + r * Math.sin(a)).toFixed(1)}`;
  const mid = (a0 + a1) / 2;
  const rm = (r0 + r1) / 2;
  return {
    d: `M${p(a0, r1)} A${r1} ${r1} 0 0 1 ${p(a1, r1)} L${p(a1, r0)} A${r0} ${r0} 0 0 0 ${p(a0, r0)} Z`,
    label: [200 + rm * Math.cos(mid), 200 + rm * Math.sin(mid)] as [number, number],
  };
}

function Journey() {
  const n = RING.length;
  return (
    <svg className="compass" viewBox="0 0 400 400" role="img" aria-label="วงจรชีวิตลูกค้า 8 ขั้น บนฐานข้อมูลและระบบ แตะเพื่อไปขั้นนั้น">
      {RING.map((g, i) => {
        const s = sector(i, n, 104, 176);
        return (
          <a key={g.id} href={`${basePath}/topics/#${g.id}`}>
            <path className="sec" d={s.d} fill={`var(--${g.id})`} />
            <text x={s.label[0]} y={s.label[1] + 5} textAnchor="middle" fontSize="13.5" fill="#fff">
              {SHORT[g.id]}
            </text>
          </a>
        );
      })}
      <a href={`${basePath}/topics/#data`}>
        <circle cx="200" cy="200" r="92" fill="var(--data)" className="sec" />
        <text x="200" y="192" textAnchor="middle" fontSize="15" fill="#fff">
          {SHORT.data}
        </text>
        <text x="200" y="214" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="400" opacity="0.85">
          ฐานรากของทุกขั้น
        </text>
      </a>
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <section className="hero">
        <div>
          <h1>
            แผนที่ CRM
            <br />
            เรียนรู้ทีละขั้นตามวงจรชีวิตลูกค้า
          </h1>
          <p>
            CRM ไม่ใช่ซอฟต์แวร์ แต่คือวิธีที่ธุรกิจ &quot;เข้าใจลูกค้าให้ลึกที่สุด&quot; เว็บนี้จัด {topics.length} หัวข้อ CRM ตามเส้นทางของลูกค้า{" "}
            {RING.length} ขั้น บนฐานราก &quot;ข้อมูลและระบบ&quot; เพื่อให้คุณเริ่มจากจุดที่ติดอยู่จริง
          </p>
          <p>
            ทุกหัวข้ออธิบายแบบ <b>ถาม-ตอบ</b> มี KPI ขั้นตอนลงมือทำ ข้อผิดพลาดที่พบบ่อย และ <b>Prompt ต่อยอด</b> รวม {promptCount} รายการ
            ที่คัดลอกไปใช้กับ AI ได้ทันที
            {aiEnabled && " พร้อมที่ปรึกษา AI ที่รู้จักทุกหัวข้อ"}
          </p>
          <div className="actions">
            <Link href="/topics" className="btn primary">
              เริ่มจากหัวข้อที่ติดอยู่ →
            </Link>
            <Link href="/prompts" className="btn">
              ดู Prompt ทั้ง {promptCount}
            </Link>
            {aiEnabled && (
              <Link href="/advisor" className="btn">
                ปรึกษา AI
              </Link>
            )}
          </div>
        </div>
        <Journey />
      </section>

      <section className="panel router">
        <h2>ตอนนี้ทีมของคุณกำลังพูดประโยคไหน?</h2>
        <ul>
          {groups.map((g) => (
            <li key={g.id} className={`g-${g.id}`}>
              <Link href={`/topics#${g.id}`}>
                <span className="dot" />
                <span>
                  <b>&quot;{g.sentence}&quot;</b>
                  <small>→ {g.letter}. {g.title}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <h2 className="section-title">
        {groups.length} ขั้น {topics.length} หัวข้อ ตามวงจรชีวิตลูกค้า
      </h2>
      <p className="muted" style={{ margin: "0 0 16px" }}>
        {RING.length} ขั้นแรกเรียงเป็นวงจร ดึงดูด → เปิดใช้งาน → สื่อสาร → ขยายมูลค่า → วัดผล → คาดการณ์ → รักษา → รับฟัง แล้ววนกลับ ส่วน &quot;{CORE.title}&quot;
        คือฐานรากที่ทุกขั้นยืนอยู่
      </p>
      <div className="group-grid">
        {groups.map((g) => (
          <Link key={g.id} href={`/topics#${g.id}`} className={`group-tile g-${g.id}`}>
            <h3>
              <span className="letter">{g.letter}</span> {g.title}
            </h3>
            <p>{g.question}</p>
            <div className="chips">
              {topicsIn(g.id).map((t) => (
                <span key={t.slug} className="chip">
                  {t.emoji} {t.name}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <section className="panel how-to">
        <h2>แต่ละหัวข้อมีอะไรให้บ้าง</h2>
        <ol>
          <li>
            <b>สรุปสั้น + ศัพท์ที่ต้องรู้</b> อ่านจบใน 1 นาที รู้ว่าเรื่องนี้คืออะไรและทำไมสำคัญ
          </li>
          <li>
            <b>ถาม-ตอบ 8–12 ข้อ</b> ไล่จากคำถามพื้นฐานถึงขั้นสูง ทุกคำตอบปิดท้ายด้วย Prompt ต่อยอดให้เอาไปถาม AI ต่อ
          </li>
          <li>
            <b>KPI · ขั้นตอนลงมือทำ · ข้อผิดพลาดที่พบบ่อย</b> สำหรับเอาไปวางแผนจริง
          </li>
          <li>
            <b>Mega Prompt</b> prompt ยาวแบบมีบทบาท บริบท งาน และรูปแบบผลลัพธ์ สำหรับงานใหญ่
          </li>
          <li>
            <b>Prompt 20 รายการจากหนังสือ</b> พร้อม [ช่องว่าง] ที่ต้องเติม และปุ่มคัดลอก
          </li>
          <li>
            <b>บริบทตลาดไทย + สิ่งที่ทีมข้อมูลต้องเตรียม</b> เพื่อให้ทีมการตลาดกับทีม Data คุยภาษาเดียวกัน
          </li>
        </ol>
      </section>

      {aiEnabled && (
        <section className="panel ai-band">
          <div>
            <h2>ไม่แน่ใจว่าจะเริ่มจากหัวข้อไหน?</h2>
            <p>เล่าสถานการณ์ให้ที่ปรึกษา AI ฟัง จะช่วยวินิจฉัยว่าคุณอยู่ขั้นไหน แนะนำหัวข้อที่เหมาะ และเขียน Prompt ที่ปรับเข้ากับธุรกิจของคุณ</p>
          </div>
          <Link href="/advisor" className="btn primary">
            เริ่มปรึกษา →
          </Link>
        </section>
      )}

      <section className="panel latest">
        <div className="latest-head">
          <h2>อัปเดตล่าสุด</h2>
          <Link href="/updates">ดูทั้งหมด →</Link>
        </div>
        <ul>
          {changelog.slice(0, 3).map((c, i) => (
            <li key={i}>
              <time dateTime={c.date}>{thaiDate(c.date)}</time>
              <span>{c.title}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
