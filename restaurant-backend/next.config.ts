import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.7", "localhost", "127.0.0.1"],
  serverExternalPackages: ["tesseract.js", "tesseract.js-core"],
};

export default nextConfig;
