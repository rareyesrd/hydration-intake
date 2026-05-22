import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const revision =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  process.env.npm_package_version ??
  "v1";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [
    { url: "/offline", revision },
    { url: "/dashboard", revision }
  ]
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
        pathname: "/**"
      }
    ]
  }
};

export default withSerwist(nextConfig);
