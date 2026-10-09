import type { Metadata } from "next";
import { MTop } from "@/components/mobile/MTop";
import { ProfilePanel } from "@/components/ProfilePanel";
import { PromptExplorer } from "@/components/PromptExplorer";
import { allPrompts, groups, promptCount, topics } from "@/lib/data";

export const metadata: Metadata = { title: `Prompt ทั้ง ${promptCount} รายการ` };

export default function MobilePrompts() {
  return (
    <>
      <MTop title={`Prompt ${promptCount} รายการ`} />
      <main className="m-screen m-wide">
        <p className="m-lead">
          เติม <mark className="ph">[ช่องว่าง]</mark> ให้เป็นบริบทของธุรกิจคุณ แล้วแตะ &quot;คัดลอก&quot; ไปวางใน ChatGPT, Claude หรือ Gemini
        </p>
        <ProfilePanel compact />
        <PromptExplorer groups={groups} topics={topics} prompts={allPrompts} mobile />
      </main>
    </>
  );
}
