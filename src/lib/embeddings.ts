import { getGatewayConfig } from "./gateway";

const DIMENSIONS = 128;

function hashToken(token: string) {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalize(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

/**
 * Hashed bag-of-words + bigrams. Not as smart as a real embedding model, but
 * it makes local retrieval genuinely functional with zero configuration.
 */
export function localEmbedding(text: string): number[] {
  const vector = new Array<number>(DIMENSIONS).fill(0);
  const tokens = (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((token) => token.length > 1);

  tokens.forEach((token, index) => {
    vector[hashToken(token) % DIMENSIONS] += 1;
    if (index < tokens.length - 1) {
      vector[hashToken(`${token}_${tokens[index + 1]}`) % DIMENSIONS] += 0.5;
    }
  });

  return normalize(vector);
}

export async function embed(texts: string[]): Promise<number[][]> {
  const config = getGatewayConfig();

  if (config && texts.length) {
    try {
      const response = await fetch(`${config.baseUrl}/v1/embeddings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: config.embeddingModel, input: texts }),
        signal: AbortSignal.timeout(12000),
      });

      if (response.ok) {
        const payload = (await response.json()) as { data?: Array<{ embedding: number[] }> };
        if (payload.data?.length === texts.length) {
          return payload.data.map((item) => normalize(item.embedding));
        }
      }
    } catch {
      // Fall through to local embeddings — a demo must never break.
    }
  }

  return texts.map(localEmbedding);
}

export function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  for (let index = 0; index < length; index++) dot += a[index] * b[index];
  return dot;
}
