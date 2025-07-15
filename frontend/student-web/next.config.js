/** @type {import('next').NextConfig} */

const remotePatterns = process.env.NEXT_PUBLIC_API_URL
  ? [new URL(`${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/uploads/**`)]
  : [];

const nextConfig = {
    transpilePackages: ['three'],
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns,
    },
    basePath: process.env.NEXT_BASE_PATH || '',
    assetPrefix: process.env.NEXT_BASE_PATH || '',
};

module.exports = nextConfig;
