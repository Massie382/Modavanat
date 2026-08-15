import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Type errors now FAIL the build — the prior `ignoreBuildErrors: true`
  // was silencing real bugs (see audit). ESLint is run via `npm run lint`
  // separately; non-app directories (examples/, skills/, tests/, upload/,
  // scripts/) are excluded via .eslintignore and tsconfig.json.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  allowedDevOrigins: ["localhost", "127.0.0.1", "*.space-z.ai"],
};

export default nextConfig;
