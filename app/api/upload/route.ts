import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { db } from "../../../config/db";
import { documentsTable, documentChunksTable } from "../../../config/schema";
import { generateEmbedding } from "../../../lib/embeddings";
import { extractTextFromFile, processDocumentText } from "../../../lib/document-processor";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const maxDuration = 60; // Allow more time for embeddings generation



export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("[Upload API] No file uploaded");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log(`[Upload API] Received file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    let extractedText = await extractTextFromFile(file);

    console.log(`[Upload API] Extracted text length: ${extractedText.length}`);

    if (!extractedText || extractedText.length < 20) {
      console.log("[Upload API] Extracted text too short or empty");
      return NextResponse.json({ error: "Could not extract readable content from file." }, { status: 400 });
    }

    // Step 2: Chunking & Embeddings
    console.log("[Upload API] Inserting document to DB...");
    const [insertedDoc] = await db.insert(documentsTable).values({
      fileName: file.name,
      mimeType: file.type,
      extractedText: extractedText,
      createdAt: new Date().toISOString(),
    }).returning({ id: documentsTable.id });

    console.log(`[Upload API] Document inserted with ID: ${insertedDoc.id}`);

    console.log("[Upload API] Chunking text...");
    const chunks = processDocumentText(extractedText, 500);
    console.log(`[Upload API] Created ${chunks.length} chunks. Generating embeddings...`);

    // Generate embeddings in batches to prevent memory limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      const batchPromises = batchChunks.map(async (chunk, batchIndex) => {
        const globalIndex = i + batchIndex;
        console.log(`Generating embedding for chunk ${globalIndex + 1}/${chunks.length}...`);
        const embedding = await generateEmbedding(chunk.text);
        return {
          documentId: insertedDoc.id,
          chunkText: chunk.text,
          chunkIndex: globalIndex,
          embedding: embedding,
          metadata: chunk.metadata,
        };
      });

      const insertValues = await Promise.all(batchPromises);
      await db.insert(documentChunksTable).values(insertValues);
    }
    console.log("[Upload API] Embeddings generated and saved to Vector DB.");

    // Step 3: Send to Llama for initial outline
    console.log("[Upload API] Sending to Groq for outline...");
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an AI course generator. Convert textbook content into structured course modules.",
        },
        {
          role: "user",
          content: `Generate a structured course outline from this textbook:\n\n${extractedText.substring(0, 12000)}`,
        },
      ],
      temperature: 0.5,
    });
    console.log("[Upload API] Received Groq response");

    return NextResponse.json({
      response: completion.choices[0]?.message?.content,
      documentId: insertedDoc.id,
    });
  } catch (error) {
    console.error("[Upload API] Error:", error);
    return NextResponse.json({ error: "Server error while processing file." }, { status: 500 });
  }
}