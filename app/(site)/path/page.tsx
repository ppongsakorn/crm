import type { Metadata } from "next";
import { JourneyPath, type TopicRef } from "@/components/JourneyPath";
import { ProfilePanel } from "@/components/ProfilePanel";
import { topics } from "@/lib/data";
import { starterPath } from "@/lib/paths";

export const metadata: Metadata = {
  title: starterPath.title,
  description: `${starterPath.audience} ${starterPath.intro}`,
};

export default function PathPage() {
  const refs: Record<string, TopicRef> = Object.fromEntries(topics.map((t) => [t.slug, { slug: t.slug, name: t.name, emoji: t.emoji, group: t.group }]));
  return (
    <>
      <div className="page-head">
        <h1>{starterPath.title}</h1>
        <p>{starterPath.audience}</p>
        <p>{starterPath.intro}</p>
      </div>
      <ProfilePanel compact />
      <JourneyPath path={starterPath} topics={refs} />
    </>
  );
}
