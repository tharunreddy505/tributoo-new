import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import dotenv from "dotenv";

dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

/**
 * Uploads a buffer or stream to AWS S3.
 * @param {Buffer|ReadableStream} fileContent 
 * @param {string} fileName 
 * @param {string} contentType 
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
export const uploadToS3 = async (fileContent, fileName, contentType) => {
    const bucketName = process.env.AWS_S3_BUCKET;
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const key = `uploads/${year}/${month}/${Date.now()}_${fileName}`;

    try {
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: key,
                Body: fileContent,
                ContentType: contentType,
            },
        });

        await upload.done();

        // Construct the public URL
        // Example: https://bucket-name.s3.region.amazonaws.com/key
        return `https://${bucketName}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${key}`;
    } catch (err) {
        console.error("S3 Upload Error:", err);
        throw err;
    }
};

/**
 * Helper to decode base64 string and upload to S3.
 * @param {string} base64Data 
 * @param {string} fileName 
 * @returns {Promise<string>}
 */
export const uploadBase64ToS3 = async (base64Data, fileName) => {
    // base64Data format: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."

    // Robust parsing without large regex on potentially multi-megabyte strings
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

    // Determine extension from content type if not present
    let extension = contentType.split("/")[1]?.split("+")[0] || "bin";
    if (!fileName.includes(".")) {
        fileName = `${fileName}.${extension}`;
    }

    return uploadToS3(buffer, fileName, contentType);
};

/**
 * Deletes a file from S3 by its URL.
 * @param {string} fileUrl 
 * @returns {Promise<void>}
 */
export const deleteFromS3 = async (fileUrl) => {
    if (!fileUrl) return;
    const bucketName = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION || "ap-south-1";

    // Extract key from URL: https://bucket.s3.region.amazonaws.com/key
    const baseUrl = `https://${bucketName}.s3.${region}.amazonaws.com/`;
    if (!fileUrl.startsWith(baseUrl)) {
        console.warn(`[S3] URL ${fileUrl} does not match bucket ${bucketName}. Skipping S3 delete.`);
        return;
    }

    const key = fileUrl.replace(baseUrl, "");

    try {
        console.log(`[S3] Deleting object: ${key}`);
        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        await s3Client.send(command);
    } catch (err) {
        console.error("[S3] Delete Error:", err);
    }
};

export default s3Client;
