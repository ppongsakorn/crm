import type { Metadata } from "next";
import { MTabs } from "@/components/mobile/MTabs";
import { MTop } from "@/components/mobile/MTop";
import { WhatsNew } from "@/components/WhatsNew";
import { allWhatsNew, THEME_LABEL, THEMES } from "@/lib/data";

export const metadata: Metadata = { title: "เทรนด์ CRM 2025–2026" };

export default function MobileTrends() {
  const themes = THEMES.filter((th) => allWhatsNew.some((w) => w.theme === th));
  return (
    <>
      <MTop back={{ href: "/mobile", label: "หน้าแรก" }} title="เทรนด์ 2025–26" />
      <main className="m-screen">
        <p className="m-lead">อะไรเปลี่ยนไปในโลก CRM และทีมควรทำอะไรต่างจากเดิม แตะชื่อหัวข้อเพื่ออ่านต่อ</p>
        {themes.length > 0 && (
          <MTabs
            tabs={themes.map((th) => ({
              id: th,
              label: `${THEME_LABEL[th]} ${allWhatsNew.filter((w) => w.theme === th).length}`,
              content: <WhatsNew items={allWhatsNew.filter((w) => w.theme === th)} topicHref={(s) => `/mobile/t/${s}`} />,
            }))}
          />
        )}
      </main>
    </>
  );
}
