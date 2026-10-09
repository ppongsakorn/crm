import type { Metadata } from "next";
import { Changelog } from "@/components/Changelog";
import { MTop } from "@/components/mobile/MTop";
import { changelog } from "@/lib/changelog";
import { toMobilePath } from "@/lib/mobile";

export const metadata: Metadata = { title: "ประวัติการอัปเดต" };

const mobileHref = (href: string) => (href.startsWith("/mobile") ? href : toMobilePath(href) ?? href);

export default function MobileUpdates() {
  return (
    <>
      <MTop title="ประวัติการอัปเดต" />
      <main className="m-screen">
        <p className="m-lead">เนื้อหาพัฒนาต่อเนื่อง สรุปว่าแต่ละครั้งเพิ่มหรือเปลี่ยนอะไร เรียงจากล่าสุด</p>
        <Changelog entries={changelog} mapHref={mobileHref} />
      </main>
    </>
  );
}
