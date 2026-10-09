import Link from "next/link";
import { THEME_LABEL, type Topic, type WhatsNew as Item } from "@/lib/data";

const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

/** "What changed in 2025–2026" cards. With `topicHref`, each card also links to its topic. */
export function WhatsNew({ items, topicHref }: { items: (Item & { topic?: Topic })[]; topicHref?: (slug: string) => string }) {
  return (
    <ul className="news">
      {items.map((w, i) => (
        <li key={i} className={`news-item th-${w.theme}`}>
          <div className="news-meta">
            <span className="theme">{THEME_LABEL[w.theme]}</span>
            {w.topic && topicHref && (
              <Link href={topicHref(w.topic.slug)} className="news-topic">
                {w.topic.emoji} {w.topic.name}
              </Link>
            )}
          </div>
          <b>{w.title}</b>
          <p>{w.body}</p>
          {w.sources.length > 0 && (
            <p className="news-src">
              ที่มา:{" "}
              {w.sources.map((u, j) => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer">
                  {host(u)}
                  {j < w.sources.length - 1 ? "," : ""}
                </a>
              ))}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
