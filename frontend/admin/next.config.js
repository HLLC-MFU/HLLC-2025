/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  // basePath: '/ihX0S043',
  // assetPrefix: '/ihX0S043',
  // images: {
  //     unoptimized: true,
  // },
  // publicRuntimeConfig: {
  //     basePath: '/ihX0S043',
  // },
};

module.exports = nextConfig;
