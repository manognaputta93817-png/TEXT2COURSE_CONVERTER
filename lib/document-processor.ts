import { spawn } from "child_process";

export interface DocumentMetadata {
    pageNumber?: number;
    chapterTitle?: string;
    sectionTitle?: string;
}

export interface DocumentChunk {
    text: string;
    metadata: DocumentMetadata;
}

export function runTesseractOnBuffer(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const tesseractProcess = spawn("tesseract", ["stdin", "stdout", "-l", "eng"]);
        let extractedText = "";
        let errorMessage = "";

        tesseractProcess.stdout.on("data", (data) => {
            extractedText += data.toString();
        });

        tesseractProcess.stderr.on("data", (data) => {
            errorMessage += data.toString();
        });

        tesseractProcess.on("close", (code) => {
            if (code === 0) {
                resolve(extractedText.trim());
            } else {
                console.warn(`[OCR Warning] Tesseract exited with code ${code}. Error: ${errorMessage}`);
                resolve(extractedText.trim());
            }
        });

        tesseractProcess.on("error", (err) => {
            reject(new Error(`Failed to start native tesseract CLI: ${err.message}`));
        });

        try {
            tesseractProcess.stdin.write(buffer);
            tesseractProcess.stdin.end();
        } catch (e) {
            reject(e);
        }
    });
}

function render_page(pageData: any) {
    let render_options = {
        normalizeWhitespace: false,
        disableCombineTextItems: false
    };
    return pageData.getTextContent(render_options)
        .then(function (textContent: any) {
            let lastY, text = '';
            for (let item of textContent.items) {
                if (lastY !== item.transform[5] && lastY !== undefined) {
                    text += '\n';
                }
                text += item.str;
                lastY = item.transform[5];
            }
            return `\n[PAGE_${pageData.pageNumber}]\n` + text;
        });
}

export async function extractPdfTextWithPages(buffer: Buffer): Promise<string> {
    let text = "";
    try {
        // @ts-ignore
        const pdfParseModule = await import("pdf-parse");
        // @ts-ignore
        const pdfParse = pdfParseModule.default || pdfParseModule;
        const data = await pdfParse(buffer, { pagerender: render_page, max: 0, version: 'v2.0.550' } as any);
        text = data.text.trim();
    } catch (err) {
        console.error("PDF PARSE ERROR:", err);
    }

    // fallback OCR if empty
    if (!text || text.length < 50) {
        text = "";
        try {
            const { fromBuffer } = await import("pdf2pic");
            const options = { density: 150, format: "png", width: 1024, height: 1448 };
            const convert = fromBuffer(buffer, options);
            const results = await convert.bulk(-1, { responseType: "base64" });

            for (const result of results) {
                if (result && result.base64) {
                    console.log(`Running native OCR on PDF page ${result.page}...`);
                    const imageBuffer = Buffer.from(result.base64, "base64");
                    const pageText = await runTesseractOnBuffer(imageBuffer);
                    text += `\n[PAGE_${result.page}]\n` + pageText + "\n\n";
                }
            }
        } catch (ocrErr) {
            console.error("OCR Fallback Error:", ocrErr);
        }
    }

    return text.trim();
}

export async function extractTextFromFile(file: File): Promise<string> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = file.name.toLowerCase();
        const mimeType = file.type.toLowerCase();

        if (mimeType === "application/pdf" || fileName.endsWith('.pdf')) {
            return await extractPdfTextWithPages(buffer);
        } else if (mimeType === "text/plain" || fileName.endsWith('.txt')) {
            return buffer.toString("utf-8");
        } else if (mimeType.includes("wordprocessingml") || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
            const mammothModule = await import("mammoth");
            const mammoth = mammothModule.default;
            const result = await mammoth.extractRawText({ buffer });
            return result.value.trim();
        } else if (mimeType.startsWith("image/") || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
            const text = await runTesseractOnBuffer(buffer);
            return text.trim();
        } else {
            return `Unsupported file type.`;
        }
    } catch (error) {
        console.error("Extraction error:", error);
        return `Failed to extract text.`;
    }
}

export function cleanText(text: string): string {
    return text.replace(/\x00/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export function processDocumentText(text: string, maxTokens: number = 500): DocumentChunk[] {
    text = cleanText(text);

    // Naive token approximation (1 regex token ~ 4 chars) (~2000 chars)
    const maxChars = maxTokens * 4;

    const chunks: DocumentChunk[] = [];

    let currentPage = 1;
    let currentChapter = "";
    let currentSection = "";

    const lines = text.split('\n');
    let currentChunkText = "";

    const pageRegex = /^\[PAGE_(\d+)\]$/i;
    const chapterRegex = /^(?:chapter|module|unit|lesson)\s*\d+[:\.\-]?\s*(.*)$/i;
    const sectionRegex = /^(?:section)\s*\d+[:\.\-]?\s*(.*)$/i;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            currentChunkText += "\n";
            continue;
        }

        const pageMatch = trimmed.match(pageRegex);
        if (pageMatch) {
            currentPage = parseInt(pageMatch[1], 10);
            continue;
        }

        const chapterMatch = trimmed.match(chapterRegex);
        if (chapterMatch && trimmed.length < 200) {
            currentChapter = trimmed;
            currentSection = "";

            if (currentChunkText.trim().length > 0) {
                chunks.push({
                    text: currentChunkText.trim(),
                    metadata: { pageNumber: currentPage, chapterTitle: currentChapter, sectionTitle: currentSection }
                });
                currentChunkText = "";
            }
        }

        const sectionMatch = trimmed.match(sectionRegex);
        if (sectionMatch && trimmed.length < 200) {
            currentSection = trimmed;
        }

        currentChunkText += trimmed + "\n";

        if (currentChunkText.length >= maxChars) {
            // Find a good split point (last period or sentence ending)
            let splitIndex = currentChunkText.lastIndexOf(". ");
            if (splitIndex === -1 || splitIndex < maxChars / 2) { // If no good sentence break, split at maxChars
                splitIndex = currentChunkText.lastIndexOf(" ");
            }
            if (splitIndex === -1) {
                splitIndex = maxChars;
            }

            const chunkToPush = currentChunkText.substring(0, splitIndex + 1).trim();
            if (chunkToPush) {
                chunks.push({
                    text: chunkToPush,
                    metadata: { pageNumber: currentPage, chapterTitle: currentChapter, sectionTitle: currentSection }
                });
            }
            currentChunkText = currentChunkText.substring(splitIndex + 1).trim() + "\n";
        }
    }

    if (currentChunkText.trim().length > 0) {
        chunks.push({
            text: currentChunkText.trim(),
            metadata: { pageNumber: currentPage, chapterTitle: currentChapter, sectionTitle: currentSection }
        });
    }

    return chunks;
}
