import type { NextConfig } from "next";
const nextConfig: NextConfig = {
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
