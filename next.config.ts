import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { cpus: 1 },
  serverExternalPackages: ['pg'],
  async headers() {
    return [{source:'/:path(admin|admin-login|login|signin-with-chatgpt|signout-with-chatgpt)',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]}];
  },
};

export default nextConfig;
