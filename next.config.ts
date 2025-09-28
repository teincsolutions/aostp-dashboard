import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_BASE_URL:  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.akomapacargo.com/api/v1',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '__NEXT_PUBLIC_GOOGLE_CLIENT_ID__',
  },
};

export default nextConfig;
