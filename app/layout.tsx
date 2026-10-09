import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { promptCount, topics } from "@/lib/data";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import "./globals.css";

const plex = IBM_Plex_Sans_Thai({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: `%s · ${SITE_NAME}` },
  description: `เรียนรู้ CRM ${topics.length} หัวข้อตามวงจรชีวิตลูกค้า 9 ขั้น แบบถาม-ตอบ พร้อม ${promptCount} prompts และ Mega Prompt ให้เอาไปต่อยอดกับ AI`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#15181d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={plex.variable}>
      <body>{children}</body>
    </html>
  );
}
