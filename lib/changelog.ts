import raw from "@/data/changelog.json";

export type ChangeKind = "launch" | "content" | "feature" | "fix";

/** One entry in the site's public history log (data/changelog.json, newest first). */
export interface Change {
  date: string; // YYYY-MM-DD
  kind: ChangeKind;
  title: string;
  items: string[];
  links?: { label: string; href: string }[];
}

export const changelog = raw as Change[];

export const KIND_LABEL: Record<ChangeKind, string> = {
  launch: "เปิดตัว",
  content: "เนื้อหา",
  feature: "ฟีเจอร์",
  fix: "แก้ไข",
};

const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/** "2026-10-09" → "9 ต.ค. 2026" */
export function thaiDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
