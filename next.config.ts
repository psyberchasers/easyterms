import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "easyterms.ngrok.dev",
    "https://easyterms.ngrok.dev",
    "*.ngrok.dev",
  ],
};

export default nextConfig;
