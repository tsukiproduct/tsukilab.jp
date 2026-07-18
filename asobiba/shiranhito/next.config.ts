import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/asobiba/shiranhito",
  assetPrefix: "/asobiba/shiranhito",
  trailingSlash: true,
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
