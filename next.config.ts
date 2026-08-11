import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output: tạo bản build tự chứa (server.js) để đóng gói Docker image nhỏ gọn.
  output: "standalone",
  // API proxy: browser gọi cùng origin (/api/...), Next server proxy sang từng backend.
  // Khi lên prod, thay bằng API Gateway hoặc reverse proxy — chỉ cần đổi biến môi trường.
  async rewrites() {
    const identityApi = process.env.IDENTITY_API_URL ?? "http://localhost:8081";
    const practiceApi = process.env.PRACTICE_API_URL ?? "http://localhost:8087";
    const progressApi = process.env.PROGRESS_API_URL ?? "http://localhost:8083";
    const contentBuilderApi = process.env.CONTENT_BUILDER_API_URL ?? "http://localhost:8082";
    const examinationApi = process.env.EXAMINATION_API_URL ?? "http://localhost:8088";

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
      {
        // Frontend gọi:  /api/content-builder/v1/<resource>
        // Backend nghe:  /api/v1/content-builder/<resource>
        source: "/api/content-builder/v1/:path*",
        destination: `${contentBuilderApi}/api/v1/content-builder/:path*`,
      },
      {
        // Frontend gọi:  /api/examination/v1/<resource>
        // Backend nghe:  /api/v1/<resource> (vd: /api/v1/exams, /api/v1/criterias)
        source: "/api/examination/v1/:path*",
        destination: `${examinationApi}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
