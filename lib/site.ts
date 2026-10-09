/**
 * Build-time switches (see next.config.ts):
 * - basePath: set when the site is served from a sub-path, e.g. GitHub Pages `/<repo>`.
 * - aiEnabled: false for the static export, which has no server for /api/chat.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const aiEnabled = process.env.NEXT_PUBLIC_AI_ENABLED !== "false";

export const SITE_NAME = "แผนที่ CRM";
export const SITE_TAGLINE = "เรียนรู้ CRM แบบถาม-ตอบ พร้อม Prompt ต่อยอด";
