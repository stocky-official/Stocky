import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@stocky/icons', '@stocky/tokens', '@stocky/types'],
  reactStrictMode: true,
  allowedDevOrigins: ['localhost', '127.0.0.1'],
};

export default nextConfig;
