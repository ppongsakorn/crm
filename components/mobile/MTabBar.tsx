"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { basePath } from "@/lib/site";
import { toDesktopPath } from "@/lib/mobile";

const ICON = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  search: "M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.8 4.8-1.4 1.4-4.8-4.8A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z",
  prompts: "M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z",
  updates: "M12 3a9 9 0 1 1-8.5 6h2.2A7 7 0 1 0 12 5V3zm-1 4h2v5.6l3.7 2.2-1 1.7L11 13.7z",
  desktop: "M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-7v2h3v2H7v-2h3v-2H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 2v9h16V6z",
};

function Icon({ d }: { d: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} fill="currentColor" />
    </svg>
  );
}

/** Bottom tab bar, the phone app's main navigation. */
export function MTabBar() {
  const path = usePathname() ?? "/mobile";
  const at = (p: string) => (p === "/mobile" ? path === "/mobile" || path === "/mobile/" : path.startsWith(p));
  const tabs = [
    { href: "/mobile", label: "หน้าแรก", icon: ICON.home, on: at("/mobile") || at("/mobile/g") || at("/mobile/t") },
    { href: "/mobile/search", label: "ค้นหา", icon: ICON.search, on: at("/mobile/search") },
    { href: "/mobile/prompts", label: "Prompts", icon: ICON.prompts, on: at("/mobile/prompts") },
    { href: "/mobile/updates", label: "อัปเดต", icon: ICON.updates, on: at("/mobile/updates") },
  ];
  return (
    <nav className="m-tabs" aria-label="เมนูหลัก">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className="m-tab" aria-current={t.on ? "page" : undefined}>
          <Icon d={t.icon} />
          <span>{t.label}</span>
        </Link>
      ))}
      <a className="m-tab" href={basePath + toDesktopPath(path)} data-view="full">
        <Icon d={ICON.desktop} />
        <span>เว็บเต็ม</span>
      </a>
    </nav>
  );
}
