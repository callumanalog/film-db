import type { NextConfig } from "next";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Read .env.local so client and server bundles get Supabase vars (Turbopack sometimes doesn't expose process.env)
function loadEnvLocal(): Record<string, string> {
  const out: Record<string, string> = {};
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return out;
  try {
    const content = readFileSync(path, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
        value = value.slice(1, -1);
      if (key.startsWith("NEXT_PUBLIC_")) out[key] = value;
    }
  } catch {
    // ignore
  }
  return out;
}

const envLocal = loadEnvLocal();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? envLocal.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/gallery", destination: "/references", permanent: true },
    ];
  },
};

export default nextConfig;
