/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://backend:8000/api/:path*", // Proxy to Backend
      },
    ];
  },
};

module.exports = nextConfig;
