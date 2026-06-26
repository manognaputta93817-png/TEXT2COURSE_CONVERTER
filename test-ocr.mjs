import fs from 'fs';
import { fromBuffer } from 'pdf2pic';
import tesseract from 'tesseract.js';

async function testOCR() {
    try {
        // Read the user's PDF
        const pdfPath = "AKSHAYA'S ENGLISH CASE STUDY.pdf";
        if (!fs.existsSync(pdfPath)) {
            console.log('PDF not found at ' + pdfPath);
            return;
        }

        const buffer = fs.readFileSync(pdfPath);
        console.log(`Read ${buffer.length} bytes from PDF`);

        const options = {
            density: 150,
            format: "png",
            width: 1024,
            height: 1448
        };

        console.log("Converting PDF pages to images...");
        const convert = fromBuffer(buffer, options);
        // Convert just the first page to save time
        const results = await convert.bulk(1, { responseType: "base64" });

        console.log(`Got ${results.length} pages back from pdf2pic`);

        for (const result of results) {
            if (result && result.base64) {
                console.log(`Running OCR on page ${result.page}...`);
                const { data } = await tesseract.recognize(`data:image/png;base64,${result.base64}`, "eng");
                console.log("\n--- EXTRACTED TEXT ---");
                console.log(data.text.substring(0, 500) + '...');
                console.log("----------------------");
            }
        }
    } catch (err) {
        console.error("Test Error:", err);
    }
}

testOCR();
