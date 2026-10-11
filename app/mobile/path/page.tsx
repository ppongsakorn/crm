import type { Metadata } from "next";
import { JourneyPath, type TopicRef } from "@/components/JourneyPath";
import { MTop } from "@/components/mobile/MTop";
import { ProfilePanel } from "@/components/ProfilePanel";
import { topics } from "@/lib/data";
import { starterPath } from "@/lib/paths";

export const metadata: Metadata = { title: starterPath.title };

export default function MobilePath() {
  const refs: Record<string, TopicRef> = Object.fromEntries(topics.map((t) => [t.slug, { slug: t.slug, name: t.name, emoji: t.emoji, group: t.group }]));
  return (
    <>
      <MTop back={{ href: "/mobile", label: "หน้าแรก" }} title="เส้นทางเริ่มต้น" />
      <main className="m-screen">
        <header className="m-head">
          <h1>{starterPath.title}</h1>
          <p>{starterPath.intro}</p>
        </header>
        <ProfilePanel compact />
        <JourneyPath path={starterPath} topics={refs} mobile />
      </main>
    </>
  );
}
