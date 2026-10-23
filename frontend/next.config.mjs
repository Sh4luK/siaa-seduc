/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // turbopack: {
  //   root: __dirname,
  // },
  reactCompiler: true,
  allowedDevOrigins: ['172.0.0.1'],
  async rewrites() {
    const apiUrl = process.env.NODE_ENV === "development"
      ? process.env.BACKEND_URL || "http://localhost:8000"
      : process.env.NEXT_PUBLIC_API_URL || "https://siaa-backend.vercel.app";
    const apiBase = apiUrl.replace(/\/$/, "");
    return [
      {
        source: "/backend-api/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};


export default nextConfig;