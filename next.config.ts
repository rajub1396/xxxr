import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { cpus: 1 },
  serverExternalPackages: ['pg'],
};

export default nextConfig;
