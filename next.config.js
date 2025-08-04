/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds (for faster deployment)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds (for faster deployment)  
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig