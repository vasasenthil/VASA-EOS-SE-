/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone server output for containerised / sovereign-cloud deployment
  // (produces .next/standalone with a minimal node server + traced deps).
  output: "standalone",
  eslint: {
    // Optionally, you can also set this to false during debugging
    // ignoreDuringBuilds: false, 
  },
  typescript: {
    ignoreBuildErrors: false, // Changed to false
  },
  // If you had a top-level ignoreBuildErrors, remove it or set to false
  // ignoreBuildErrors: false, 
  images: {
    unoptimized: true,
  },
}

export default nextConfig
