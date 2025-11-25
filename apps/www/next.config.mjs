/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: '**.freeimages.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: '**.freepik.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: ''
      }
    ]
  }
};

export default nextConfig;
