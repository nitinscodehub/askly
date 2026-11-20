import { type NextRequest } from "next/server";
import { getGatewayConfig } from "@/lib/gateway";
import { retrieve } from "@/lib/retrieval";
import type { ChatMessage, SourceRef } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GatewayChunk = { choices?: Array<{ delta?: { content?: string } }> };

function encode(payload: unknown) {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "does", "what", "how", "are", "can", "you",
  "your", "from", "this", "that", "have", "about", "when", "where", "does",
]);

function localAnswer(question: string, sources: SourceRef[]) {
  if (!sources.length) {
    return "I could not find anything relevant in the knowledge base yet. Add a document or load the sample knowledge base, then ask again.";
  }

  const queryTokens = new Set(
    (question.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
      (token) => token.length > 3 && !STOP_WORDS.has(token),
    ),
  );

  // Pick the most question-relevant sentences across every retrieved source,
  // not just the top chunk — keeps local mode genuinely useful.
  const candidates = sources
    .flatMap((source) =>
      source.text
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => ({ sentence: sentence.trim(), docName: source.docName })),
    )
    .filter((candidate) => candidate.sentence.length > 35)
    .map((candidate) => {
      const tokens = candidate.sentence.toLowerCase().match(/[a-z0-9]+/g) ?? [];
      const hits = tokens.filter((token) => queryTokens.has(token)).length;
      return { ...candidate, score: hits / Math.sqrt(tokens.length || 1) };
    })
    .sort((a, b) => b.score - a.score);

  const picked = candidates.filter((candidate) => candidate.score > 0).slice(0, 3);
  const excerpt = (
    picked.length ? picked.map((candidate) => candidate.sentence) : [sources[0].text.slice(0, 320)]
  ).join(" ");

  const list = sources.map((source, index) => `[${index + 1}] ${source.docName}`).join(" · ");
  const lead = picked[0]?.docName ?? sources[0].docName;

  return `Based on **${lead}**, here is what I found:\n\n${excerpt}\n\nSources: ${list}`;
}

export async function POST(request: NextRequest) {
  let question: string;
  let history: ChatMessage[] = [];

  try {
    const body = (await request.json()) as { question?: string; history?: ChatMessage[] };
    question = body.question?.trim().slice(0, 2000) ?? "";
    history = Array.isArray(body.history) ? body.history.slice(-6) : [];
    if (!question) throw new Error("Missing question");
  } catch {
    return Response.json({ error: "A question is required" }, { status: 400 });
  }

  const sources = await retrieve(question, 4);
  const context = sources
    .map(
      (source, index) =>
        `[${index + 1}] ${source.docName} (section ${source.chunkIndex + 1}):\n${source.text}`,
    )
    .join("\n\n");

  const config = getGatewayConfig();
  const systemPrompt = [
    "You are a precise knowledge-base assistant.",
    "Answer ONLY from the provided context. If the context does not contain the answer, say so clearly.",
    "Be concise and cite sources inline using [1], [2], etc. Do not invent facts.",
    context ? `CONTEXT:\n${context}` : "CONTEXT: (empty knowledge base)",
  ].join("\n\n");

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let finished = false;
      const send = (payload: unknown) => controller.enqueue(encode(payload));
      const finish = () => {
        if (finished) return;
        finished = true;
        send({ type: "done" });
        controller.close();
      };

      send({ type: "sources", sources });

      if (config) {
        try {
          const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: config.model,
              stream: true,
              temperature: 0.2,
              messages: [
                { role: "system", content: systemPrompt },
                ...history.map((message) => ({
                  role: message.role,
                  content: message.content.slice(0, 1500),
                })),
                { role: "user", content: question },
              ],
            }),
            signal: AbortSignal.timeout(30000),
          });

          if (response.ok && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const payload = line.slice(6).trim();
                if (payload === "[DONE]") {
                  finish();
                  return;
                }
                try {
                  const chunk = JSON.parse(payload) as GatewayChunk;
                  const delta = chunk.choices?.[0]?.delta?.content;
                  if (delta) send({ type: "delta", text: delta });
                } catch {
                  // Ignore keep-alive / non-JSON frames.
                }
              }
            }
            finish();
            return;
          }
        } catch {
          // Fall through to the built-in answer generator.
        }
      }

      const answer = localAnswer(question, sources);
      for (const token of answer.split(/(\s+)/)) {
        send({ type: "delta", text: token });
        await new Promise((resolve) => setTimeout(resolve, 14));
      }
      finish();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
