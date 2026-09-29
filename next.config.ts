import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  async redirects() {
    return [
      // Old links (e.g. sign-up emails already sent) pointed at /protected.
      { source: "/protected", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
