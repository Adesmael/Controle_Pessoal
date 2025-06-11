
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // Adicionado para exportação estática
  typescript: {
    // ignoreBuildErrors: true, // Removido para mostrar erros de TypeScript
  },
  eslint: {
    // ignoreDuringBuilds: true, // Removido para mostrar erros de ESLint
  },
  images: {
    unoptimized: true, // Necessário para 'next export' se estiver usando next/image
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
