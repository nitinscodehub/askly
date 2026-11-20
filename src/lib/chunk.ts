import type { TextChunk } from "./types";

/**
 * Paragraph-aware chunker with overlap. Keeps semantic units together so
 * retrieval returns useful passages instead of arbitrary string slices.
 */
export function chunkText(content: string, size = 620, overlap = 90): TextChunk[] {
  const clean = content.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  const paragraphs = clean.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const chunks: TextChunk[] = [];
  let buffer = "";

  const flush = () => {
    const text = buffer.trim();
    if (text) chunks.push({ index: chunks.length, text });
    buffer = "";
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > size) {
      flush();
      for (let start = 0; start < paragraph.length; start += size - overlap) {
        chunks.push({
          index: chunks.length,
          text: paragraph.slice(start, start + size),
        });
        if (start + size >= paragraph.length) break;
      }
      continue;
    }

    if (buffer && buffer.length + paragraph.length + 2 > size) flush();
    buffer += buffer ? `\n\n${paragraph}` : paragraph;
  }
  flush();

  return chunks;
}
