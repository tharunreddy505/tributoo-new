/**
 * Optimizes an image file by resizing and compressing it.
 * @param {File} file The image file to optimize.
 * @param {Object} options Optimization options.
 * @param {number} options.maxWidth The maximum width/height of the output image.
 * @param {number} options.quality The compression quality (0 to 1).
 * @param {string} options.format The output format (e.g., 'image/jpeg', 'image/webp').
 * @returns {Promise<string>} A promise that resolves to the optimized image as a DataURL.
 */
export const compressImage = (file, { maxWidth = 1000, quality = 0.6, format = 'image/jpeg' } = {}) => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('File is not an image'));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width *= maxWidth / height;
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                if (format === 'image/jpeg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                }

                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL(format, quality);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Compresses an image and returns a Blob.
 * Better for multipart/form-data uploads.
 */
export const compressImageToBlob = (file, { maxWidth = 1000, quality = 0.6, format = 'image/jpeg' } = {}) => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('File is not an image'));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width *= maxWidth / height;
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                if (format === 'image/jpeg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                }

                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, format, quality);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Converts a file to a Base64 string without optimization.
 * Useful for videos or files that shouldn't be compressed this way.
 * @param {File} file The file to convert.
 * @returns {Promise<string>} A promise that resolves to the DataURL.
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};
