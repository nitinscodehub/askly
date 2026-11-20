import { cosineSimilarity, embed } from "./embeddings";
import { allChunks } from "./store";
import type { SourceRef } from "./types";

/** Semantic search over every ingested chunk, highest similarity first. */
export async function retrieve(query: string, topK = 4): Promise<SourceRef[]> {
  const chunks = allChunks();
  if (!chunks.length) return [];

  const [queryVector] = await embed([query]);

  return chunks
    .map((chunk) => ({
      docId: chunk.docId,
      docName: chunk.docName,
      chunkIndex: chunk.index,
      text: chunk.text,
      score: cosineSimilarity(queryVector, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((source) => source.score > 0.02);
}
