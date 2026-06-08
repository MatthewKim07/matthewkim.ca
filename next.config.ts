import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [50, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.microlink.io",
      },
    ],
  },
};

export default nextConfig;
