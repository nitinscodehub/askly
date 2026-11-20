export interface DocumentChunk {
  id: string;
  docId: string;
  docName: string;
  index: number;
  text: string;
  embedding: number[];
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  chunks: number;
  createdAt: string;
}

export interface SourceRef {
  docId: string;
  docName: string;
  chunkIndex: number;
  text: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceRef[];
  createdAt: string;
}

export interface TextChunk {
  index: number;
  text: string;
}
