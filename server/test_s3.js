import { uploadBase64ToS3 } from './s3_helper.js';

async function test() {
    console.log("Testing S3 upload...");
    console.log("USE_S3:", process.env.USE_S3);
    const testBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    try {
        const url = await uploadBase64ToS3(testBase64, "test_upload_from_script.png");
        console.log("SUCCESS! URL:", url);
    } catch (err) {
        console.error("FAILURE!", err);
    }
}

test();
