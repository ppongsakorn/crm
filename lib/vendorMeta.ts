import type { BusinessType } from "@/lib/paths";

/** Types and labels for the tools catalogue, free of data so client components can import them. */

export type Origin = "th" | "intl";
export type Size = "micro" | "sme" | "mid" | "enterprise";
export type PriceTier = "free" | "low" | "mid" | "enterprise";

export interface Vendor {
  name: string;
  company?: string;
  origin: Origin;
  country: string;
  url: string;
  size: Size[];
  types: BusinessType[];
  priceTier: PriceTier;
  priceNote: string;
  thai: string;
  goodFor: string;
  watchOut: string;
  source: string;
  /** Official page of the product that fits this category (falls back to url). */
  productUrl?: string;
  /** Product lines worth naming, each with its own page. */
  products?: { name: string; what: string; url: string }[];
  /** Conflict-of-interest note shown on the card, e.g. the site author's employer. */
  disclosure?: string;
}

/** One kind of software a business uses for CRM, with the providers to compare (data/vendors/<id>.json). */
export interface ToolCategory {
  id: string;
  name: string;
  en: string;
  what: string;
  whenNeeded: string;
  chooseBy: string[];
  freeStart: string;
  note?: string;
  vendors: Vendor[];
}

export const ORIGIN_LABEL: Record<Origin, string> = { th: "ไทย", intl: "ต่างประเทศ" };
export const SIZE_LABEL: Record<Size, string> = { micro: "ร้านเล็ก/คนเดียว", sme: "SME", mid: "กลาง", enterprise: "องค์กรใหญ่" };
export const TIER_LABEL: Record<PriceTier, string> = { free: "มีแผนฟรี", low: "ราคาเบา", mid: "ราคากลาง", enterprise: "ราคาองค์กร" };

export const TOOLS_DISCLAIMER =
  "รายชื่อนี้ค้นคว้าจากเว็บไซต์ทางการของผู้ให้บริการ ไม่มีการรับสปอนเซอร์หรือจัดอันดับ ราคาและฟีเจอร์เปลี่ยนได้เสมอ ควรตรวจกับผู้ให้บริการและทดลองใช้ก่อนตัดสินใจ";

/** What the starter path shows per category: just enough to name a few options. */
export interface ToolRef {
  id: string;
  name: string;
  count: number;
  vendors: (Pick<Vendor, "name" | "url" | "productUrl" | "origin" | "country" | "priceTier" | "types" | "size"> & { logo?: string })[];
}

/** Icon and short tab label per category, for the catalogue's navigation. */
export const CATEGORY_EMOJI: Record<string, string> = {
  "crm-core": "🗂️",
  "pos-store": "🧾",
  "ecommerce-ops": "📦",
  "consent-pdpa": "🔐",
  "chat-commerce": "💬",
  messaging: "✉️",
  loyalty: "🎁",
  helpdesk: "🎧",
  feedback: "⭐",
  "data-analytics": "📊",
  "ai-assistants": "🤖",
};
export const CATEGORY_SHORT: Record<string, string> = {
  "crm-core": "CRM",
  "pos-store": "POS",
  "ecommerce-ops": "ร้านออนไลน์",
  "consent-pdpa": "PDPA",
  "chat-commerce": "แชต/LINE OA",
  messaging: "อีเมล/SMS",
  loyalty: "สะสมแต้ม",
  helpdesk: "Helpdesk",
  feedback: "เสียงลูกค้า",
  "data-analytics": "ข้อมูล",
  "ai-assistants": "AI",
};

/** Host used to look up a vendor's logo in data/logos.json. */
export const vendorHost = (v: Pick<Vendor, "url">): string => {
  try {
    return new URL(v.url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/** A deeper company write-up shown in a dialog from the vendor's cards (data/profiles.json, keyed by host). */
export interface CompanyProfile {
  name: string;
  legalName?: string;
  founded?: string;
  hq?: string;
  summary: string;
  companyClaims?: string;
  products: { name: string; what: string; url: string }[];
  integrations?: string[];
  clients?: { name: string; source: string }[];
  news?: { date: string; title: string; url: string }[];
  watchOut?: string[];
  sources?: string[];
  disclosure?: string;
}
