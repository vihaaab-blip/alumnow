import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: {
    // Alumni profile photos are either user-uploaded data: URLs (rendered as
    // plain <img>, since next/image can't optimize inline base64 anyway) or
    // picsum.photos placeholders used as a fallback when no photo is set.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  experimental: {
    // Default is 1mb. Profile photos are resized client-side before upload
    // (see src/lib/image.ts) so they should never come close to this, but a
    // larger ceiling is cheap insurance against the exact class of failure
    // that was silently rejecting alumni applications with oversized photos.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};
export default nextConfig;
