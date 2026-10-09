import type { Metadata } from "next";
import { Changelog } from "@/components/Changelog";
import { changelog } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "ประวัติการอัปเดต",
  description: "สรุปว่าเนื้อหาและฟีเจอร์ของแผนที่ CRM เปลี่ยนอะไรไปบ้าง เรียงจากล่าสุด",
};

export default function UpdatesPage() {
  return (
    <>
      <div className="page-head">
        <h1>ประวัติการอัปเดต</h1>
        <p>เว็บนี้พัฒนาเนื้อหาต่อเนื่อง หน้านี้สรุปว่าแต่ละครั้งเพิ่มหรือเปลี่ยนอะไร เรียงจากล่าสุด</p>
      </div>
      <Changelog entries={changelog} />
    </>
  );
}
