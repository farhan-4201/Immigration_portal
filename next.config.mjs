/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    outputFileTracing: false,
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        // Skip linting during production build to avoid Windows glob/junction permission errors
        ignoreDuringBuilds: true,
    },
    // Prevent webpack from scanning restricted directories on Windows
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
            };
        }
        return config;
    },
};

export default nextConfig;
