import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { db } from "../../../config/db";
import { documentChunksTable, documentsTable } from "../../../config/schema";
import { generateEmbedding } from "../../../lib/embeddings";
import { cosineDistance, desc, sql } from "drizzle-orm";

export const runtime = "nodejs";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

import { spawn } from "child_process";

function runTesseractOnBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    // We pass "stdin" and "stdout" to tell the Tesseract CLI to read from stdin and write to stdout
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
        resolve(extractedText.trim()); // Return whatever text was successfully extracted
      }
    });

    tesseractProcess.on("error", (err) => {
      reject(new Error(`Failed to start native tesseract CLI (is it installed?): ${err.message}`));
    });

    try {
      tesseractProcess.stdin.write(buffer);
      tesseractProcess.stdin.end();
    } catch (e) {
      reject(e);
    }
  });
}

/* ================= PDF TEXT EXTRACTION ================= */

async function extractPdfText(buffer: Buffer): Promise<string> {
  let text = "";
  try {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    const data = await pdfParse(buffer, { max: 0, version: 'v2.0.550' });
    text = data.text.replace(/\\s+/g, ' ').replace(/[^\\x20-\\x7E\\n]/g, '').trim();
  } catch (err) {
    console.error("PDF PARSE ERROR:", err);
  }

  if (!text || text.length < 50) {
    try {
      const { fromBuffer } = await import("pdf2pic");
      const Tesseract = (await import("tesseract.js")).default;
      const options = { density: 150, format: "png", width: 1024, height: 1448 };
      const convert = fromBuffer(buffer, options);
      const results = await convert.bulk(-1, { responseType: "base64" });

      let ocrText = "";
      for (const result of results) {
        if (result && result.base64) {
          console.log(`Running native OCR on PDF page ${result.page}...`);
          const imageBuffer = Buffer.from(result.base64, "base64");
          const pageText = await runTesseractOnBuffer(imageBuffer);
          ocrText += pageText + "\\n\\n";
        }
      }
      text = ocrText.trim();
    } catch (ocrErr) {
      console.error("OCR Fallback Error:", ocrErr);
    }
  }

  if (!text || text.length === 0) return "Unable to read PDF content.";
  return text;
}

/* ================= TEXT EXTRACTION ================= */

async function extractTextFromFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();

    if (mimeType === "application/pdf" || fileName.endsWith('.pdf')) {
      return await extractPdfText(buffer);
    } else if (mimeType === "text/plain" || fileName.endsWith('.txt')) {
      return buffer.toString("utf-8");
    } else if (mimeType.includes("wordprocessingml") || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      const mammoth = (await import("mammoth")).default;
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

function chunkText(text: string, maxChunkSize: number = 2000): string[] {
  if (!text || text.length === 0) return [];
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\\s+/);
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxChunkSize) {
      currentChunk += (currentChunk ? " " : "") + sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  if (chunks.length === 1 && chunks[0].length > maxChunkSize) {
    const chars: string[] = [];
    for (let i = 0; i < text.length; i += maxChunkSize) {
      chars.push(text.slice(i, i + maxChunkSize));
    }
    return chars;
  }
  return chunks;
}


function getRelevantSection(text: string, query: string): string {
  if (!query) return text;

  // Extract patterns like "chapter 1", "module 2", "lesson 3"
  const match = query.match(/(?:chapter|module|unit|lesson)\s*\d+/i);
  if (match) {
    const sectionName = match[0].toLowerCase();
    console.log(`[Chat API] Smart Search: User asked for ${sectionName}`);

    const lowerText = text.toLowerCase();
    const indexStart = lowerText.indexOf(sectionName);

    if (indexStart !== -1) {
      const type = sectionName.replace(/\d+/g, '').trim();
      const num = parseInt(sectionName.replace(/[^\d]/g, ''));
      const nextSectionName = `${type} ${num + 1}`;

      let indexEnd = lowerText.indexOf(nextSectionName, indexStart + sectionName.length);

      if (indexEnd !== -1) {
        console.log(`[Chat API] Extracted from ${sectionName} to ${nextSectionName}`);
        return text.substring(indexStart, indexEnd);
      } else {
        // If next chapter not found, return 25,000 characters from the start of the chapter
        console.log(`[Chat API] Extracted ${sectionName} to end of buffer`);
        return text.substring(indexStart, indexStart + 25000);
      }
    }
  }

  return text; // Fallback to full text
}
const maxDuration = 60; // Allow more time for embeddings generation

/* ================= MAIN API HANDLER ================= */

export async function POST(req: NextRequest) {
  try {
    console.log("[Chat API] Request received");
    const formData = await req.formData();
    const message = (formData.get("message") as string) || "";
    const uploadedFiles = formData.getAll("file") as File[];

    let fileErrors: string[] = [];
    const fileNames: string[] = [];

    let relevantContext = "";

    // Process new uploaded files in chat
    for (const file of uploadedFiles) {
      console.log(`[Chat API] Processing file: ${file.name}`);
      const rawText = await extractTextFromFile(file);
      const text = getRelevantSection(rawText, message); // only read the requested pages/chapter


      if (text.startsWith("Unable to read") || text.startsWith("Failed to extract") || text.startsWith("Unsupported file")) {
        fileErrors.push(`${file.name}: ${text}`);
      } else {
        console.log(`[Chat API] Inserting document to DB...`);
        const [insertedDoc] = await db.insert(documentsTable).values({
          fileName: file.name,
          mimeType: file.type,
          extractedText: text,
          createdAt: new Date().toISOString(),
        }).returning({ id: documentsTable.id });

        const chunks = chunkText(text, 1000);
        console.log(`[Chat API] Created ${chunks.length} chunks. Generating embeddings...`);

        const BATCH_SIZE = 5;
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
          const batchChunks = chunks.slice(i, i + BATCH_SIZE);
          const batchPromises = batchChunks.map(async (chunk, batchIndex) => {
            const globalIndex = i + batchIndex;
            const embedding = await generateEmbedding(chunk);
            return {
              documentId: insertedDoc.id,
              chunkText: chunk,
              chunkIndex: globalIndex,
              embedding: embedding,
            };
          });

          const insertValues = await Promise.all(batchPromises);
          await db.insert(documentChunksTable).values(insertValues);
        }

        relevantContext += `\n\n--- Content from Newly Uploaded File: ${file.name} ---\n\n${text.substring(0, 10000)}`;

        fileNames.push(file.name);
      }
    }

    // If query was empty but files were uploaded, we just continue so the AI can analyze the new file context.
    // Ensure we have a default message if it's completely empty.
    let finalMessage = message.trim() || (uploadedFiles.length > 0 ? "Please analyze the uploaded files." : "");

    // Retrieve from database context based on message
    if (finalMessage) {
      console.log("[Chat API] Generating embedding for query...");
      const queryEmbedding = await generateEmbedding(finalMessage);

      console.log("[Chat API] Searching vector database...");
      // Using cosine distance for pgvector
      const similarity = sql`1 - (${cosineDistance(documentChunksTable.embedding, queryEmbedding)})`;

      const relevantDBChunks = await db
        .select({
          chunkText: documentChunksTable.chunkText,
          similarity
        })
        .from(documentChunksTable)
        .orderBy((t) => desc(t.similarity))
        .limit(10); // get top 10 chunks

      // Filter to chunks with a decent similarity score
      const topChunks = relevantDBChunks.filter(c => Number(c.similarity) > 0.3);

      if (topChunks.length > 0) {
        const dbContext = topChunks.map(c => c.chunkText).join("\n\n");
        relevantContext += `\n\n--- Relevant Database Context ---\n\n${dbContext}`;
      } else if (relevantDBChunks.length > 0) {
        // Fallback to top 3 if all are below 0.3 just in case
        const dbContext = relevantDBChunks.slice(0, 3).map(c => c.chunkText).join("\n\n");
        relevantContext += `\n\n--- Relevant Database Context ---\n\n${dbContext}`;
      }
    }

    // Handle case where DB holds no docs AND user didn't upload any AND message is empty
    if (!relevantContext && !finalMessage) {
      return NextResponse.json({ success: true, data: "Hello! How can I help you today? Please upload a document or ask a question." });
    }

    // Generate Response using Groq LLaMA
    const prompt = `You are a helpful AI assistant. Answer the user's question accurately.

${fileNames.length > 0 ? `Newly Uploaded Files: ${fileNames.join(', ')}\n` : ''}
${fileErrors.length > 0 ? `\nNote: Some files had errors: ${fileErrors.join('; ')}\n` : ''}

Retrieved Context:
${relevantContext || "No specifically relevant document context found."}

User Question: ${finalMessage}

CRITICAL INSTRUCTIONS:
1. Answer the question DIRECTLY and IMMEDIATELY.
2. NEVER say phrases like "Based on the retrieved context", "Since the context does not contain", or "According to the document".
3. NEVER mention whether you used the retrieved context or your general knowledge. Just provide the answer.
4. Format your response using markdown: 
# - ALWAYS make headings, sideheadings  and subheadings **bold**. 
- ALWAYS make project titles (e.g., "Project 1", "Project 2", etc.) **bold**.
- For quizzes:
  - The topic name MUST be **bold**
  - Each question MUST be **bold**
  - Each answer MUST be **bold**
- All remaining context must be in normal text.
5. If asked to generate diagrams or images, reply with exactly this text: "For generating diagrams and images, please visit the Craiyon website at [https://www.craiyon.com/en](https://www.craiyon.com/en) to easily create your visuals."
6. If asked to generate a flowchart, format it EXACTLY like this example, using a code block for the steps:
🧠 [Title] (Highly Engaging)

\`\`\`
[Emoji] [Step 1]

[Emoji] [Step 2]
↓
[Emoji] [Step 3]
\`\`\`

✅ Why it's unique:
- [Point 1]
- [Point 2]`;

    console.log("[Chat API] Sending to Groq...");
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant. Answer the user's questions seamlessly and directly.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (err) {
          console.error("Stream Error:", err);
          controller.enqueue(encoder.encode("\\n\\n[Error generating response stream]"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate response" },
      { status: 500 }
    );
  }
}