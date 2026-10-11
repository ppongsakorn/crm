import type { Metadata } from "next";
import { MTop } from "@/components/mobile/MTop";
import { ToolsCatalog } from "@/components/ToolsCatalog";
import { logos, TOOL_SECTIONS, TOOLS_DISCLAIMER, toolCategories, vendorCount } from "@/lib/vendors";

export const metadata: Metadata = { title: "เครื่องมือและผู้ให้บริการ CRM" };

export default function MobileTools() {
  return (
    <>
      <MTop back={{ href: "/mobile", label: "หน้าแรก" }} title="เครื่องมือ CRM" />
      <main className="m-screen">
        <header className="m-head">
          <h1>เครื่องมือและผู้ให้บริการ CRM</h1>
          <p>
            {toolCategories.length} หมวด {vendorCount} รายการ ไทยและต่างประเทศ
          </p>
          <p className="tools-disclaimer">{TOOLS_DISCLAIMER}</p>
        </header>
        <ToolsCatalog sections={TOOL_SECTIONS} categories={toolCategories} logos={logos} mobile />
      </main>
    </>
  );
}
