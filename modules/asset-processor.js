/**
 * asset-processor.js - Image processing utilities for CasaOS Generator
 * 
 * Handles converting uploaded images to square PNG icons or
 * aspect-ratio-preserving screenshots using Canvas API.
 */

/**
 * Process an image data URL into a square PNG icon (max 256x256).
 * Crops to a centered square, then resizes to fit maxSize.
 * @param {string} dataUrl - The source image data URL
 * @param {number} maxSize - Maximum width/height in pixels (default 256)
 * @returns {Promise<{ dataUrl: string, blob: Blob, size: number, dimensions: string }>}
 */
export function processImageToPng(dataUrl, maxSize = 256) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Square crop: use the smaller dimension
                const size = Math.min(img.width, img.height, maxSize);
                canvas.width = size;
                canvas.height = size;

                // Center and crop
                const offsetX = (img.width - size) / 2;
                const offsetY = (img.height - size) / 2;
                ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);

                canvas.toBlob((blob) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        resolve({
                            dataUrl: e.target.result,
                            blob,
                            size: blob.size,
                            dimensions: `${size}x${size}`,
                        });
                    };
                    reader.onerror = () => reject(new Error('Failed to read PNG blob'));
                    reader.readAsDataURL(blob);
                }, 'image/png');
            } catch (err) {
                reject(err);
            }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
    });
}

/**
 * Process an image data URL into a PNG screenshot, maintaining aspect ratio.
 * @param {string} dataUrl - The source image data URL
 * @param {number} maxWidth - Max width in pixels (default 1280)
 * @param {number} maxHeight - Max height in pixels (default 720)
 * @returns {Promise<{ dataUrl: string, blob: Blob, size: number, dimensions: string }>}
 */
export function processScreenshot(dataUrl, maxWidth = 1280, maxHeight = 720) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let { width, height } = img;

                // Maintain aspect ratio while fitting within bounds
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                canvas.width = Math.round(width);
                canvas.height = Math.round(height);

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        resolve({
                            dataUrl: e.target.result,
                            blob,
                            size: blob.size,
                            dimensions: `${canvas.width}x${canvas.height}`,
                        });
                    };
                    reader.onerror = () => reject(new Error('Failed to read PNG blob'));
                    reader.readAsDataURL(blob);
                }, 'image/png');
            } catch (err) {
                reject(err);
            }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
    });
}