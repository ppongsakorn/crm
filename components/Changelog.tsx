import Link from "next/link";
import { KIND_LABEL, thaiDate, type Change } from "@/lib/changelog";

/** The history log. `mapHref` lets the mobile app point links at its own screens. */
export function Changelog({ entries, mapHref = (h) => h }: { entries: Change[]; mapHref?: (href: string) => string }) {
  return (
    <ol className="changelog">
      {entries.map((c, i) => (
        <li key={i} className={`change k-${c.kind}`}>
          <div className="change-meta">
            <time dateTime={c.date}>{thaiDate(c.date)}</time>
            <span className="kind">{KIND_LABEL[c.kind]}</span>
          </div>
          <h3>{c.title}</h3>
          <ul>
            {c.items.map((t, j) => (
              <li key={j}>{t}</li>
            ))}
          </ul>
          {c.links?.length ? (
            <p className="change-links">
              {c.links.map((l) => (
                <Link key={l.href} href={mapHref(l.href)}>
                  {l.label} →
                </Link>
              ))}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
