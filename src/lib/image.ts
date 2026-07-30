// Standard profile photo size used everywhere a photo is displayed
// (network cards, profile header, admin review list): a square image,
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
      // Crop to a square, then scale to the target size. Horizontally we
      // still center-crop (subjects are rarely off-center left/right). But
      // for a portrait-orientation source (taller than wide — the common
      // case for a phone headshot), a true vertical center-crop chops off
      // the top of the frame whenever the face sits in the upper third of
      // the shot, which is how most people naturally frame themselves. So
      // for portrait sources we bias the vertical crop window upward
      // instead of centering it, keeping more headroom instead of chin-room.
      const srcSize = Math.min(img.naturalWidth, img.naturalHeight);
      const srcX = (img.naturalWidth - srcSize) / 2;
      const maxSrcY = img.naturalHeight - srcSize;
      const isPortrait = img.naturalHeight > img.naturalWidth;
      const srcY = isPortrait ? maxSrcY * 0.15 : maxSrcY / 2;
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
