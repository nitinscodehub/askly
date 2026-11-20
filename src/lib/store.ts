import { randomUUID } from "node:crypto";
import { chunkText } from "./chunk";
import { embed } from "./embeddings";
import type { DocumentChunk, KnowledgeDocument } from "./types";

type Store = {
  chunks: Map<string, DocumentChunk>;
  documents: Map<string, KnowledgeDocument>;
};

// Survive Next.js hot reloads in development.
const globalScope = globalThis as typeof globalThis & { __asklyStore?: Store };
const store: Store = globalScope.__asklyStore ?? {
  chunks: new Map(),
  documents: new Map(),
};
globalScope.__asklyStore = store;

export async function addDocument(name: string, content: string) {
  const id = randomUUID();
  const chunks = chunkText(content);
  if (!chunks.length) throw new Error("Document contains no text");

  const vectors = await embed(chunks.map((chunk) => chunk.text));

  chunks.forEach((chunk, index) => {
    const record: DocumentChunk = {
      id: `${id}-${index}`,
      docId: id,
      docName: name,
      index: chunk.index,
      text: chunk.text,
      embedding: vectors[index],
    };
    store.chunks.set(record.id, record);
  });

  const document: KnowledgeDocument = {
    id,
    name,
    chunks: chunks.length,
    createdAt: new Date().toISOString(),
  };
  store.documents.set(id, document);
  return document;
}

export function listDocuments(): KnowledgeDocument[] {
  return [...store.documents.values()].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt),
  );
}

export function deleteDocument(id: string) {
  store.documents.delete(id);
  for (const [key, chunk] of store.chunks) {
    if (chunk.docId === id) store.chunks.delete(key);
  }
}

export function clearDocuments() {
  store.documents.clear();
  store.chunks.clear();
}

export function allChunks(): DocumentChunk[] {
  return [...store.chunks.values()];
}
