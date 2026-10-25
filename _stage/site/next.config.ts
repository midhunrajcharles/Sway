import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No floating Next.js dev badge: the site should look the same in development as in production.
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
