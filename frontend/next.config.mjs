/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NODE_ENV === 'development' && {
    serverRuntimeConfig: {
      NODE_TLS_REJECT_UNAUTHORIZED: '0',
    },
  }),
  env: {
    BACKEND_API_URL: process.env.BACKEND_API_URL || 'http://localhost:5279/api',
  },
};

export default nextConfig;
