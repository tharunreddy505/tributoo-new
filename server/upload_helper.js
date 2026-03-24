import fs from 'fs';
import path from 'path';

/**
 * Saves a base64-encoded string to the local filesystem in a WordPress-style structure:
 * uploads/YYYY/MM/filename.ext
 * 
 * @param {string} base64Data 
 * @param {string} fileName 
 * @returns {Promise<string>} The relative path to the saved file.
 */
export const uploadBase64Local = async (base64Data, fileName) => {
    if (!base64Data || !base64Data.startsWith('data:')) {
        throw new Error("Invalid base64 string: Must start with data:");
    }

    const colonIndex = base64Data.indexOf(':');
    const semicolonIndex = base64Data.indexOf(';');
    const commaIndex = base64Data.indexOf(',');

    if (colonIndex === -1 || semicolonIndex === -1 || commaIndex === -1) {
        throw new Error("Invalid DataURL format");
    }

    const contentType = base64Data.substring(colonIndex + 1, semicolonIndex);
    const base64Content = base64Data.substring(commaIndex + 1);
    const buffer = Buffer.from(base64Content, "base64");

    // Determine extension from content type if not present in filename
    let extension = contentType.split("/")[1]?.split("+")[0] || "bin";
    if (extension === 'jpeg') extension = 'jpg'; // Normalizing

    let finalFileName = fileName;
    if (!finalFileName.includes(".")) {
        finalFileName = `${finalFileName}.${extension}`;
    }

    // Use current date for directory structure
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    // Root directory for uploads
    const uploadsRoot = 'uploads';
    const relativeDir = path.join(uploadsRoot, year, month);
    const absoluteDir = path.resolve(process.cwd(), relativeDir);

    // Ensure directory exists
    if (!fs.existsSync(absoluteDir)) {
        fs.mkdirSync(absoluteDir, { recursive: true });
    }

    // Generate unique name to avoid overwriting
    const uniqueFileName = `${Date.now()}_${finalFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const absolutePath = path.join(absoluteDir, uniqueFileName);

    // Relative path for database/web serving (normalized with forward slashes)
    const relativePath = `/uploads/${year}/${month}/${uniqueFileName}`;

    fs.writeFileSync(absolutePath, buffer);

    return relativePath;
};

/**
 * Deletes a file from the local filesystem.
 * @param {string} relativePath (e.g., /uploads/2026/03/file.jpg)
 */
export const deleteLocalFile = async (relativePath) => {
    if (!relativePath || !relativePath.startsWith('/uploads/')) return;

    // Normalize path (remove leading / and convert to absolute)
    const normalized = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    const absolutePath = path.resolve(process.cwd(), normalized);

    try {
        if (fs.existsSync(absolutePath)) {
            console.log(`[LOCAL] Deleting file: ${absolutePath}`);
            fs.unlinkSync(absolutePath);
        }
    } catch (err) {
        console.error("[LOCAL] Delete Error:", err);
    }
};
