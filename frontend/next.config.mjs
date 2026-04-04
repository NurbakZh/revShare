import { createRequire } from 'module'

const require = createRequire(import.meta.url)

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
            child_process: false,
        }
        if (!isServer) {
            config.resolve.fallback.process = require.resolve(
                'process/browser',
            )
        }
        return config
    },
}

export default nextConfig
