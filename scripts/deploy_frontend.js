import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readdir, readFile } from "fs/promises";
import { join, relative } from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const BUCKET_NAME = "tributo-frontend"; // Explicitly defined by user
const DIST_DIR = join(__dirname, "../dist");

/**
 * Get Content-Type based on extension
 */
function getContentType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const map = {
        'html': 'text/html',
        'js': 'application/javascript',
        'css': 'text/css',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'svg': 'image/svg+xml',
        'json': 'application/json',
        'ico': 'image/x-icon',
        'txt': 'text/plain'
    };
    return map[ext] || 'application/octet-stream';
}

/**
 * Upload directory recursively
 */
async function uploadDirectory(dir) {
    const files = await readdir(dir, { recursive: true, withFileTypes: true });

    for (const file of files) {
        if (file.isDirectory()) continue;

        const fullPath = join(file.path, file.name);
        const relativePath = relative(DIST_DIR, fullPath).replace(/\\/g, '/');
        const fileContent = await readFile(fullPath);

        console.log(`Uploading ${relativePath}...`);

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: relativePath,
            Body: fileContent,
            ContentType: getContentType(file.name),
        });

        try {
            await s3Client.send(command);
        } catch (err) {
            console.error(`Failed to upload ${relativePath}:`, err);
        }
    }
}

async function main() {
    console.log(`Starting deployment to s3://${BUCKET_NAME}...`);
    try {
        await uploadDirectory(DIST_DIR);
        console.log("Deployment completed successfully!");
    } catch (err) {
        console.error("Deployment failed:", err);
    }
}

main();
