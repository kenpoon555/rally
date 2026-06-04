/** Stage 2: enforce before profile/activity image upload (storage integration TBD). */
export const MAX_IMAGE_FILE_BYTES = 512 * 1024;
export const MAX_IMAGE_DIMENSION_PX = 1024;
export const JPEG_QUALITY_TARGET = 0.82;

export function validateImageAsset(sizeBytes: number, width: number, height: number): string | null {
  if (sizeBytes > MAX_IMAGE_FILE_BYTES) {
    return `Image must be under ${Math.round(MAX_IMAGE_FILE_BYTES / 1024)} KB. Compress before uploading.`;
  }
  if (width > MAX_IMAGE_DIMENSION_PX || height > MAX_IMAGE_DIMENSION_PX) {
    return `Image dimensions must be at most ${MAX_IMAGE_DIMENSION_PX}px on the longest side.`;
  }
  return null;
}

/**
 * When adding expo-image-picker + manipulator, resize to max dimension and re-encode JPEG
 * at JPEG_QUALITY_TARGET before upload. Until then, URL-only photos use profilePhotoValidation.
 */
export const IMAGE_UPLOAD_GUIDANCE =
  'Compress photos to 1024px max edge and under 512 KB before upload.';
