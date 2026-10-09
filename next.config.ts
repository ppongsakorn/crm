import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a static site (GitHub Pages): no server, so the AI
// advisor is switched off. Otherwise a standalone Node server with /api/chat.
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = isStatic ? process.env.PAGES_BASE_PATH ?? "" : "";

const nextConfig: NextConfig = isStatic
  ? {
      output: "export",
      basePath,
      trailingSlash: true,
      images: { unoptimized: true },
      // Route handlers can't be exported; only *.tsx / *.ts pages are built,
      // so app/api/chat/route.server.ts is skipped in this mode.
      pageExtensions: ["tsx", "ts"],
      env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_AI_ENABLED: "false" },
      poweredByHeader: false,
    }
  : {
      output: "standalone",
      pageExtensions: ["tsx", "ts", "server.ts"],
      env: { NEXT_PUBLIC_AI_ENABLED: "true" },
      poweredByHeader: false,
    };

export default nextConfig;
