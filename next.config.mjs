/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/downloads/shohoj-staff-latest.apk',
          destination: '/downloads/shohoj-staff-v1.6.3.apk',
        },
      ],
      afterFiles: [],
      fallback: [
        {
          source: '/downloads/:file*',
          destination: '/api/mobile/download/staff?file=:file*',
        },
      ],
    };
  },
};

export default nextConfig;
