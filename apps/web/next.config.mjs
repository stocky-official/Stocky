/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@stocky/icons', '@stocky/tokens', '@stocky/types'],
  reactStrictMode: true,
};

export default nextConfig;
