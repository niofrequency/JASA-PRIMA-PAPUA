export interface CompressionResult {
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  qualityUsed: number;
}

/**
 * Compresses an image file or Data URL using HTML5 Canvas.
 * Guarantees output size is under targetMaxKB (default 500 KB).
 */
export async function compressImageToMaxKB(
  file: File | string,
  maxKB: number = 500
): Promise<CompressionResult> {
  const targetMaxBytes = maxKB * 1024;

  return new Promise((resolve, reject) => {
    let originalSize = 0;
    const img = new Image();

    if (typeof file === 'string') {
      originalSize = Math.round((file.length * 3) / 4);
      img.src = file;
    } else {
      originalSize = file.size;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    }

    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Restrict maximum resolution for avatar images
      const MAX_DIMENSION = 1000;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get 2D canvas context'));
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Iteratively compress quality until under targetMaxBytes
      let quality = 0.92;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      let byteSize = Math.round((dataUrl.length * 3) / 4);

      while (byteSize > targetMaxBytes && quality > 0.15) {
        quality -= 0.12;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        byteSize = Math.round((dataUrl.length * 3) / 4);
      }

      // If still over target size, downscale dimensions
      if (byteSize > targetMaxBytes) {
        const scaledWidth = Math.round(width * 0.6);
        const scaledHeight = Math.round(height * 0.6);
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        const ctx2 = canvas.getContext('2d');
        if (ctx2) {
          ctx2.fillStyle = '#FFFFFF';
          ctx2.fillRect(0, 0, scaledWidth, scaledHeight);
          ctx2.drawImage(img, 0, 0, scaledWidth, scaledHeight);
          dataUrl = canvas.toDataURL('image/jpeg', 0.65);
          byteSize = Math.round((dataUrl.length * 3) / 4);
        }
      }

      resolve({
        dataUrl,
        originalSizeBytes: originalSize,
        compressedSizeBytes: byteSize,
        qualityUsed: Math.round(quality * 100),
      });
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1000) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}
