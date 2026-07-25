/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    memoryBasedWorkersCount: true,
  },
};

export default nextConfig;
