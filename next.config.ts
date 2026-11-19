import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 도커 이미지에 실행에 필요한 파일만 담기 위한 출력 (.next/standalone)
  output: "standalone",
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
