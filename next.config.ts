import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve the existing static homepage at / without rewriting HTML files.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/index.html" }],
    };
  },
};

export default nextConfig;
