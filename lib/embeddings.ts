import { pipeline, env } from '@xenova/transformers';

// Configuration for server-side execution
env.allowLocalModels = false;
env.useBrowserCache = false;

class EmbeddingsPipeline {
    static instance: any = null;

    static async getInstance(progressCallback?: any) {
        if (this.instance === null) {
            this.instance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { progress_callback: progressCallback });
        }
        return this.instance;
    }
}

export async function generateEmbedding(text: string): Promise<number[]> {
    const extractor = await EmbeddingsPipeline.getInstance();
    // Generate embeddings with mean pooling and normalization
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    // return as regular array of numbers
    return Array.from(output.data);
}
