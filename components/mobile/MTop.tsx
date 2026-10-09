import Link from "next/link";
import { JourneyMark } from "@/components/JourneyMark";
import { SITE_NAME } from "@/lib/site";

/** Top app bar: a back button and title on inner screens, the brand on the home screen. */
export function MTop({ title, back }: { title?: string; back?: { href: string; label: string } }) {
  return (
    <header className="m-top">
      {back ? (
        <Link href={back.href} className="m-back" aria-label={`กลับไป ${back.label}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z" fill="currentColor" />
          </svg>
          <span>{back.label}</span>
        </Link>
      ) : title ? null : (
        <span className="m-brand">
          <JourneyMark size={24} />
          {SITE_NAME}
        </span>
      )}
      {title && <span className="m-title">{title}</span>}
    </header>
  );
}
