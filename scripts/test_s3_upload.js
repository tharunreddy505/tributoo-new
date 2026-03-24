import { uploadBase64ToS3 } from "../server/s3_helper.js";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

async function testUpload() {
    let result = "--- S3 Upload Test ---\n";
    result += `Bucket: ${process.env.AWS_S3_BUCKET}\n`;

    const testBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";

    try {
        const url = await uploadBase64ToS3(testBase64, "s3_connection_test.png");
        result += "SUCCESS!\n";
        result += `URL: ${url}\n`;
    } catch (err) {
        result += "FAILED!\n";
        result += `Error: ${err.message}\n`;
    }

    writeFileSync(join(__dirname, "../s3_test_result.txt"), result, "utf8");
}

testUpload();
