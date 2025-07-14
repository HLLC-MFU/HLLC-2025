/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['three'],
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        domains: ['hllc.mfu.ac.th'],
    },
    basePath: process.env.NEXT_BASE_PATH || '',
    assetPrefix: process.env.NEXT_BASE_PATH || '',
};

module.exports = nextConfig;
