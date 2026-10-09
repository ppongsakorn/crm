/**
 * Placeholder filling shared by the prompt UI and the WebMCP fill_prompt tool.
 * Pure functions with no imports, so node --test can load this file directly.
 */

export interface ProfileField {
  id: string;
  label: string;
  example: string;
  /** Matches a normalised placeholder (see normalizeKey). */
  match: RegExp;
}

/** The business details people fill once; each covers the placeholder spellings used across the prompts. */
export const PROFILE_FIELDS: ProfileField[] = [
  { id: "businessType", label: "ประเภทธุรกิจ", example: "ร้านกาแฟ 5 สาขา", match: /^(ประเภทธุรกิจ|ธุรกิจ|ประเภทธุรกิจของคุณ|อุตสาหกรรม|อุตสาหกรรมเป้าหมาย|ชื่อ\/ประเภทธุรกิจ)$/ },
  { id: "businessName", label: "ชื่อธุรกิจหรือแบรนด์", example: "Baan Coffee", match: /^(ชื่อธุรกิจ|ชื่อแบรนด์|แบรนด์|ชื่อร้าน|ชื่อบริษัท|ชื่อธุรกิจ\/แบรนด์|ชื่อร้าน\/แบรนด์)$/ },
  { id: "product", label: "สินค้าหรือบริการหลัก", example: "กาแฟและเบเกอรี่", match: /^(สินค้า\/บริการ|สินค้า|บริการ|สินค้าหรือบริการ|ประเภทสินค้า|หมวดสินค้า|สินค้า\/บริการหลัก)$/ },
  { id: "audience", label: "กลุ่มลูกค้าเป้าหมาย", example: "คนทำงานออฟฟิศ อายุ 25–40", match: /^(กลุ่มเป้าหมาย|กลุ่มลูกค้า|กลุ่มลูกค้าเป้าหมาย|ลูกค้าเป้าหมาย|persona ของกลุ่มเป้าหมาย|persona)$/ },
  { id: "channels", label: "ช่องทางหรือแพลตฟอร์มหลัก", example: "LINE OA, Shopee, หน้าร้าน", match: /^(ช่องทาง|ช่องทางหลัก|ช่องทางติดต่อหลัก|ช่องทางการตลาด|แพลตฟอร์ม|แพลตฟอร์มเป้าหมาย|แพลตฟอร์มหลัก|ช่องทาง\/แพลตฟอร์ม)$/ },
  { id: "crm", label: "ระบบ CRM หรือเครื่องมือที่ใช้", example: "HubSpot", match: /^(crm|ชื่อ crm|crm software ที่ใช้|crm ที่ใช้|crm system|crm tool|crm platform|ชื่อระบบ|ระบบ crm|ระบบ crm ที่ใช้|เครื่องมือ crm)$/ },
];

export type Profile = Record<string, string>;

/** Every distinct placeholder in a prompt, in order of first appearance, without brackets. */
export function placeholders(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\[([^\]\n]+)\]/g)) {
    const p = m[1].trim();
    if (p && !out.includes(p)) out.push(p);
  }
  return out;
}

/** "ประเภทธุรกิจ เช่น ร้านอาหาร" → "ประเภทธุรกิจ"; lower-cased so Latin words match case-insensitively. */
export function normalizeKey(ph: string): string {
  return ph.split(/\s+เช่น|เช่น|:|：|\(/)[0].trim().replace(/\s+/g, " ").toLowerCase();
}

export function fieldFor(ph: string): ProfileField | undefined {
  const k = normalizeKey(ph);
  return PROFILE_FIELDS.find((f) => f.match.test(k));
}

/**
 * The value for one placeholder: an exact custom answer for that placeholder wins,
 * then the business-profile field it maps to. Empty strings count as missing.
 */
export function valueFor(ph: string, profile: Profile, custom: Profile): string | undefined {
  const exact = custom[ph.trim()]?.trim();
  if (exact) return exact;
  const f = fieldFor(ph);
  const v = f ? profile[f.id]?.trim() : undefined;
  return v || undefined;
}

export type Segment = { text: string; placeholder?: string; filled?: boolean };

/** The prompt split into plain text and placeholder pieces, with each placeholder resolved if possible. */
export function segments(text: string, profile: Profile = {}, custom: Profile = {}): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(/\[([^\]\n]+)\]/g)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index) });
    const ph = m[1].trim();
    const v = valueFor(ph, profile, custom);
    out.push(v ? { text: v, placeholder: ph, filled: true } : { text: m[0], placeholder: ph, filled: false });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

/** Fill a prompt. Unknown placeholders stay as [placeholder] and are listed in `missing`. */
export function fillPrompt(text: string, profile: Profile = {}, custom: Profile = {}) {
  const segs = segments(text, profile, custom);
  const filled = [...new Set(segs.filter((s) => s.filled).map((s) => s.placeholder!))];
  const missing = [...new Set(segs.filter((s) => s.placeholder && !s.filled).map((s) => s.placeholder!))];
  return { prompt: segs.map((s) => s.text).join(""), filled, missing };
}
