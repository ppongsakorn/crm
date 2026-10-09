import Link from "next/link";
import { JourneyMark } from "@/components/JourneyMark";
import { aiEnabled, SITE_NAME } from "@/lib/site";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="accent-bar" aria-hidden="true" />
      <header className="site-header">
        <div className="wrap">
          <Link href="/" className="brand">
            <JourneyMark />
            <span>{SITE_NAME}</span>
          </Link>
          <nav className="nav" aria-label="หลัก">
            <Link href="/topics">หัวข้อ</Link>
            <Link href="/prompts">Prompts</Link>
            <Link href="/updates">อัปเดต</Link>
            {aiEnabled && (
              <Link href="/advisor" className="cta">
                ปรึกษา AI
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="wrap">{children}</main>
      <footer className="site-footer">
        <div className="wrap">
          <p>
            โครงสร้างหัวข้อและ prompt ทั้ง 500 รายการเรียบเรียงจาก{" "}
            <a href="https://github.com/ppongsakorn/prompts-book-template-thai" target="_blank" rel="noopener noreferrer">
              500 CRM Prompts Book (Thai Version)
            </a>{" "}
            โดย <b>BUZZEBEES</b> · ส่วนความรู้ถาม-ตอบ ค้นคว้าเพิ่มเติมจากแหล่งสาธารณะและให้ลิงก์อ้างอิงไว้ท้ายแต่ละหัวข้อ · ตัวเลข benchmark เป็นค่าอ้างอิง
            ควรตรวจกับข้อมูลของธุรกิจคุณเอง
            {aiEnabled && " · คำแนะนำจาก AI เป็นข้อมูลประกอบการตัดสินใจ ไม่ใช่คำตัดสินแทนคุณ"}
          </p>
          <p className="footer-links">
            <Link href="/topics">หัวข้อทั้งหมด</Link> · <Link href="/prompts">Prompt ทั้งหมด</Link> · <Link href="/updates">ประวัติการอัปเดต</Link> ·{" "}
            <a href="https://crm.buzzebees.com/" target="_blank" rel="noopener noreferrer">
              crm.buzzebees.com
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
