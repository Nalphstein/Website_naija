import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Disable type-check and ESLint errors from breaking the build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* config options here */
};

export default nextConfig;
