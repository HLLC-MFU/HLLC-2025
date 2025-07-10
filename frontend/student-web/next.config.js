/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['three'],
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

module.exports = nextConfig;
