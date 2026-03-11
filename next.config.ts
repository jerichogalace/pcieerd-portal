import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'localhost',
    '.z.ai',
    '.space.z.ai',
  ],
};

export default nextConfig;
