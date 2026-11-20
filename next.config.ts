import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output: tạo bản build tự chứa (server.js) để đóng gói Docker image nhỏ gọn.
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/admin/simulations",
        destination: "/admin/simulations/scenarios",
        permanent: false,
      },
      {
        source: "/admin/operations/audit",
        destination: "/admin/audit-logs",
        permanent: false,
      },
      {
        source: "/admin/operations",
        destination: "/admin/audit-logs",
        permanent: false,
      },
    ];
  },
  // API proxy: browser gọi cùng origin (/api/...), Next server proxy sang API Gateway (Mô hình 1).
  async rewrites() {
    const gatewayApi = process.env.GATEWAY_API_URL || "http://localhost:8888";

    return [
      {
        source: "/api/:path*",
        destination: `${gatewayApi}/api/:path*`,
      },
      {
        source: "/question-images/:path*",
        destination: `${gatewayApi}/question-images/:path*`,
      },
    ];
  },
};

export default nextConfig;
