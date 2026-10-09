import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MTop } from "@/components/mobile/MTop";
import { getKnowledge, groups, topicsIn, unquote, type GroupId } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return groups.map((g) => ({ group: g.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ group: string }> }): Promise<Metadata> {
  const id = (await params).group;
  const g = groups.find((x) => x.id === id);
  return g ? { title: g.title } : {};
}

export default async function MobileGroup({ params }: { params: Promise<{ group: string }> }) {
  const id = (await params).group;
  const g = groups.find((x) => x.id === id);
  if (!g) notFound();
  const items = topicsIn(g.id as GroupId);
  return (
    <div className={`g-${g.id}`}>
      <MTop back={{ href: "/mobile", label: "หน้าแรก" }} />
      <main className="m-screen">
        <header className="m-head">
          <span className="m-tag">
            <span className="m-dot" />
            {g.letter}. {g.title}
          </span>
          <h1>&quot;{g.sentence}&quot;</h1>
          <p>{g.why}</p>
        </header>
        <ul className="m-list">
          {items.map((t) => {
            const k = getKnowledge(t.slug);
            return (
              <li key={t.slug}>
                <Link href={`/mobile/t/${t.slug}`} className="m-row">
                  <span className="m-row-main">
                    <b>
                      {t.emoji} {t.name}
                    </b>
                    <small>{k ? `“${unquote(k.whenYouSay)}”` : t.en}</small>
                  </span>
                  <span className="m-chev" aria-hidden="true">›</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
