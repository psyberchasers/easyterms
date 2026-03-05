import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "easyterms.ngrok.dev",
    "https://easyterms.ngrok.dev",
    "*.ngrok.dev",
    "*.ngrok-free.dev",
  ],
};

export default nextConfig;
