import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Mandate creation moved into a dialog on the dashboard.
    return [{ source: "/mandate", destination: "/dashboard?new=1", permanent: false }]
  },
};

export default nextConfig;
