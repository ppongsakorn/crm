import raw from "@/data/vendors.json";
import logoMap from "@/data/logos.json";
import { vendorHost, type ToolCategory, type ToolRef } from "@/lib/vendorMeta";

export * from "@/lib/vendorMeta";

/** Categories in reading order, grouped by the job they do for the business. */
export const TOOL_SECTIONS: { title: string; ids: string[] }[] = [
  { title: "เก็บและจัดการข้อมูลลูกค้า", ids: ["crm-core", "pos-store", "ecommerce-ops", "consent-pdpa"] },
  { title: "คุยกับลูกค้า", ids: ["chat-commerce", "messaging"] },
  { title: "ให้ลูกค้ากลับมาซื้อซ้ำ", ids: ["loyalty"] },
  { title: "ฟังและดูแลลูกค้า", ids: ["helpdesk", "feedback"] },
  { title: "วัดผลและใช้ AI", ids: ["data-analytics", "ai-assistants"] },
];

const byId = raw as Record<string, ToolCategory>;

export const toolCategories: ToolCategory[] = TOOL_SECTIONS.flatMap((s) => s.ids)
  .map((id) => byId[id])
  .filter(Boolean);

export const getToolCategory = (id: string): ToolCategory | undefined => byId[id];

export const vendorCount = toolCategories.reduce((n, c) => n + c.vendors.length, 0);

export function toolRefs(): Record<string, ToolRef> {
  return Object.fromEntries(
    toolCategories.map((c) => [
      c.id,
      {
        id: c.id,
        name: c.name,
        count: c.vendors.length,
        vendors: c.vendors.map(({ name, url, productUrl, origin, country, priceTier, types, size }) => ({ name, url, productUrl, origin, country, priceTier, types, size, logo: logos[vendorHost({ url })] })),
      },
    ]),
  );
}

/** host → file in public/logos (scripts/fetch-logos.py). */
export const logos = logoMap as Record<string, string>;
