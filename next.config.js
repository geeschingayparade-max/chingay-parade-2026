/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    formats: ["image/webp"],
  },
  webpack: (config) => {
    config.externals.push({
      canvas: "commonjs canvas",
    });
    return config;
  },
};

module.exports = nextConfig;
