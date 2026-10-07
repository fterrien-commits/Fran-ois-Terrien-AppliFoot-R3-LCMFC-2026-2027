/**
 * Utility functions for compressing and handling image uploads from the user's computer.
 * Compresses images client-side using HTML Canvas to prevent LocalStorage quota overflow.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
}

export async function processAndCompressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const { maxWidth = 800, maxHeight = 800, quality = 0.82 } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier sélectionné doit être une image (JPG, PNG, WebP...).');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Erreur lors de la lecture de l'image."));
    };

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        reject(new Error("Impossible de charger le fichier image."));
      };

      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Impossible d'initialiser le traitement de l'image."));
          return;
        }

        // Draw with smoothing for high fidelity
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
