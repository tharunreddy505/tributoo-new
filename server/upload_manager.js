import { uploadBase64ToS3, deleteFromS3 } from './s3_helper.js';
import { uploadBase64Local, deleteLocalFile } from './upload_helper.js';

/**
 * Unified upload handler that chooses between S3 and Local storage based on environment variables.
 * 
 * @param {string} base64Data 
 * @param {string} fileName 
 * @returns {Promise<string>}
 */
export const handleMediaUpload = async (base64Data, fileName) => {
    const useS3 = process.env.USE_S3 === 'true' || process.env.USE_S3 === true;

    if (useS3) {
        try {
            console.log(`[UPLOAD MANAGER] Using S3 for ${fileName}`);
            return await uploadBase64ToS3(base64Data, fileName);
        } catch (err) {
            console.error(`[UPLOAD MANAGER] S3 Upload failed, falling back to local:`, err.message);
            // Fallback to local if S3 fails (optional, but requested by user to "save in uploads folder")
            return await uploadBase64Local(base64Data, fileName);
        }
    } else {
        console.log(`[UPLOAD MANAGER] Using Local Storage for ${fileName}`);
        return await uploadBase64Local(base64Data, fileName);
    }
};

/**
 * Deletes a file from either S3 or Local storage.
 * @param {string} url 
 */
export const deleteMediaFromStorage = async (url) => {
    if (!url) return;

    const useS3 = process.env.USE_S3 === 'true' || process.env.USE_S3 === true;

    if (url.startsWith('http')) {
        await deleteFromS3(url);
    } else if (url.startsWith('/uploads/')) {
        await deleteLocalFile(url);
    }
};
