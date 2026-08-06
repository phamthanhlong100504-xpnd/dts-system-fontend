import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API proxy: browser gọi cùng origin (/api/...), Next server proxy sang từng backend.
  // Khi lên prod, thay bằng API Gateway hoặc reverse proxy — chỉ cần đổi biến môi trường.
  async rewrites() {
    const identityApi = process.env.IDENTITY_API_URL ?? "http://localhost:8081";
    const practiceApi = process.env.PRACTICE_API_URL ?? "http://localhost:8082";
    const progressApi = process.env.PROGRESS_API_URL ?? "http://localhost:8083";

    return [
      {
        source: "/api/identity/:path*",
        destination: `${identityApi}/api/:path*`,
      },
      {
        source: "/api/practice/:path*",
        destination: `${practiceApi}/api/:path*`,
      },
      {
        // Ảnh câu hỏi: Spring static của practice-service serve tại /question-images/**
        source: "/question-images/:path*",
        destination: `${practiceApi}/question-images/:path*`,
      },
      {
        source: "/api/progress/:path*",
        destination: `${progressApi}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
