import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/asobiba/shiranhito",
  assetPrefix: "/asobiba/shiranhito",
  trailingSlash: true,
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  env: { NEXT_PUBLIC_ASSET_BASE: "/asobiba/shiranhito" },
};

export default nextConfig;
