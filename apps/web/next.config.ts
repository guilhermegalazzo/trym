import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@trym/api", "@trym/utils", "@trym/config"],
};

export default nextConfig;
