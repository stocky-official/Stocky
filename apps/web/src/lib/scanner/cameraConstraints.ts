/**
 * Camera constraints shared by the barcode and QR readers.
 *
 * The previous scanners forced a square aspect ratio and cropped the video
 * with object-cover. On phones that can make the browser choose a smaller
 * stream and crop the code out of the useful pixels. These are ideal values,
 * so the browser can fall back to the device's native camera mode when needed.
 */
export const rearCameraConstraints: MediaTrackConstraints = {
  facingMode: { ideal: 'environment' },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  frameRate: { ideal: 30, min: 15 },
};
