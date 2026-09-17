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
    return [
      {
        source: '/downloads/shohoj-staff-v1.5.apk',
        destination: '/downloads/shohoj-staff-v1.5.7.apk',
      },
      {
        source: '/downloads/shohoj-staff-v1.5.1.apk',
        destination: '/downloads/shohoj-staff-v1.5.7.apk',
      },
      {
        source: '/downloads/shohoj-staff-v1.5.2.apk',
        destination: '/downloads/shohoj-staff-v1.5.7.apk',
      },
      {
        source: '/downloads/shohoj-staff-v1.5.3.apk',
        destination: '/downloads/shohoj-staff-v1.5.7.apk',
      },
      {
        source: '/downloads/shohoj-staff-v1.5.4.apk',
        destination: '/downloads/shohoj-staff-v1.5.7.apk',
      },
      {
        source: '/downloads/shohoj-staff-v1.5.5.apk',
        destination: '/downloads/shohoj-staff-v1.5.7.apk',
      },
      {
        source: '/downloads/shohoj-staff-v1.5.6.apk',
        destination: '/downloads/shohoj-staff-v1.5.7.apk',
      },
      {
        source: '/downloads/shohoj-staff-latest.apk',
        destination: '/downloads/shohoj-staff-v1.5.7.apk',
      },
    ];
  },
};

export default nextConfig;
