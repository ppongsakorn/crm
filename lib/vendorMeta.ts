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
  vendors: Pick<Vendor, "name" | "url" | "origin" | "country" | "priceTier" | "types" | "size">[];
}
