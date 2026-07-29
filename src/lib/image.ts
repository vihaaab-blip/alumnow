// Standard profile photo size used everywhere a photo is displayed
// (marketplace cards, profile header, admin review list): a square image,
// downscaled/cropped client-side before upload so every stored photo is a
// small, consistent, correctly-oriented square - regardless of whatever
// huge, non-square photo a phone camera originally produced. This also keeps
// the base64 data URL small enough to reliably fit in a single REST insert.
export const PROFILE_PHOTO_SIZE = 512;

export function resizeImageToDataUrl(file: File, size: number = PROFILE_PHOTO_SIZE): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not process image."));
        return;
      }
      // Center-crop to a square, then scale to the target size.
      const srcSize = Math.min(img.naturalWidth, img.naturalHeight);
      const srcX = (img.naturalWidth - srcSize) / 2;
      const srcY = (img.naturalHeight - srcSize) / 2;
      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image file."));
    };
    img.src = objectUrl;
  });
}
