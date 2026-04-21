import type { NextConfig } from "next";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxy all /api/* requests from the browser → Flask backend.
        // This means the browser never talks to the backend directly,
        // so there are zero CORS issues regardless of how the backend is run.
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
