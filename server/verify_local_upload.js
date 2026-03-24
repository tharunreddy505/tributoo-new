import fs from 'fs';
import path from 'path';
import { handleMediaUpload } from './upload_manager.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * MOCK BASE64 DATA (Transparent 1x1 Pixel PNG)
 */
const mockBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

async function testLocalUpload() {
    console.log("--- LOCAL UPLOAD VERIFICATION ---");
    console.log("Environment: USE_S3 =", process.env.USE_S3);

    try {
        const resultPath = await handleMediaUpload(mockBase64, "verification_test.png");
        console.log("UPLOAD SUCCESS!");
        console.log("Returned Path (Saved to DB):", resultPath);

        if (resultPath.startsWith('http')) {
            console.log("NOTE: S3 is currently ENABLED. File uploaded to S3.");
        } else {
            const absolutePath = path.resolve(process.cwd(), resultPath.startsWith('/') ? resultPath.substring(1) : resultPath);
            console.log("Checking if file exists on disk at:", absolutePath);

            if (fs.existsSync(absolutePath)) {
                console.log("VERIFIED: File exists on disk!");
                const stats = fs.statSync(absolutePath);
                console.log(`File size: ${stats.size} bytes`);
            } else {
                console.error("FAILURE: File does NOT exist on disk!");
            }
        }
    } catch (err) {
        console.error("UPLOAD FAILED:", err.message);
    }
}

testLocalUpload();
