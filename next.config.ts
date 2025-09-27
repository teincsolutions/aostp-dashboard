import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_BASE_URL:  '__NEXT_PUBLIC_API_BASE_URL__',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: '__NEXT_PUBLIC_GOOGLE_CLIENT_ID__',
  },
};

export default nextConfig;
