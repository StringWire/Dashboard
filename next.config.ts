import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixed: Moved to top-level to stop the "Unrecognized key" error
  allowedDevOrigins: ['37.114.37.246'],
};

export default nextConfig;
