import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  transpilePackages: ["@worqly/db", "@worqly/shared"]
};

export default nextConfig;