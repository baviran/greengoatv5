import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'lh4.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'lh5.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'lh6.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    webpack: (config, { dev, isServer }) => {
        // Add polyfills for Node.js globals in browser environment
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                setImmediate: false,
            };
        }
        
        return config;
    },
};

export default nextConfig;