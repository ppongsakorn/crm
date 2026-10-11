import type { Metadata } from "next";
import Link from "next/link";
import { ToolsCatalog } from "@/components/ToolsCatalog";
import { logos, profiles, TOOL_SECTIONS, TOOLS_DISCLAIMER, toolCategories, vendorCount } from "@/lib/vendors";

export const metadata: Metadata = {
  title: "เครื่องมือและผู้ให้บริการ CRM",
  description: "รวมซอฟต์แวร์และผู้ให้บริการที่ใช้ทำ CRM ทั้งของไทยและต่างประเทศ แยกตามหมวด พร้อมเกณฑ์เลือก ราคาเริ่มต้น และข้อควรรู้",
};

export default function ToolsPage() {
  return (
    <>
      <div className="page-head">
        <h1>เครื่องมือและผู้ให้บริการ CRM</h1>
        <p>
          {toolCategories.length} หมวด {vendorCount} รายการ ทั้งในประเทศและต่างประเทศ แต่ละหมวดบอกว่าควรเริ่มใช้เมื่อไร เลือกอย่างไร และเริ่มฟรีได้ไหม
          ถ้าเพิ่งเริ่ม ดู<Link href="/path">เส้นทางเริ่มต้น</Link>ก่อนว่าขั้นไหนต้องใช้อะไร
        </p>
        <p className="tools-disclaimer">{TOOLS_DISCLAIMER}</p>
      </div>
      <ToolsCatalog sections={TOOL_SECTIONS} categories={toolCategories} logos={logos} profiles={profiles} />
    </>
  );
}
