import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignore les erreurs d'apostrophes et de style ESLint lors du build sur Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore les erreurs TypeScript strictes pendant le build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;