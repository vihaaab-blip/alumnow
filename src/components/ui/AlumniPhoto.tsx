"use client";
import Image from "next/image";

/**
 * Renders an alumnus photo using next/image for real remote URLs (picsum.photos
 * placeholders today, and any CDN-backed photo host in future), but falls back
 * to a plain <img> for user-uploaded `data:` URLs (see src/lib/image.ts's
 * resizeImageToDataUrl) — next/image can't optimize inline base64, and passing
 * a data: URL through its loader either errors or silently no-ops depending on
 * config, so there is nothing to gain from routing it through <Image>.
 *
 * Use `fill` (default) inside a positioned container with a fixed aspect
 * ratio, matching how every profile-photo slot in this app is already laid out.
 */
export function AlumniPhoto({
  src,
  alt,
  sizes,
  className,
  onError,
  onLoad,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  onError?: () => void;
  onLoad?: () => void;
}) {
  if (src.startsWith("data:")) {
    // eslint-disable-next-line @next/next/no-img-element -- data: URLs can't be optimized by next/image
    return (
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full ${className ?? ""}`}
        onError={onError}
        onLoad={onLoad}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={onError}
      onLoad={onLoad}
    />
  );
}
