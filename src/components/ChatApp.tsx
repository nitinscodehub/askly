"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  BookOpen,
  BrainCircuit,
  FileText,
  Loader2,
  MessageSquarePlus,
} from "lucide-react";
import DocumentPanel from "./DocumentPanel";
import MessageBubble from "./MessageBubble";
import type { ChatMessage, KnowledgeDocument, SourceRef } from "@/lib/types";

type Status = { mode: string; documents: number; chunks: number } | null;

type StreamEvent = {
  type: "sources" | "delta" | "done";
  text?: string;
  sources?: SourceRef[];
};

const SUGGESTIONS = [
  "How much does the Pro plan cost?",
  "How do webhooks work?",
  "Is Nimbus SOC 2 certified?",
  "How do I reset a password?",
];

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export default function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [status, setStatus] = useState<Status>(null);
  const [showDocs, setShowDocs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const [healthResponse, docsResponse] = await Promise.all([
      fetch("/api/health"),
      fetch("/api/documents"),
    ]);
    if (healthResponse.ok) setStatus((await healthResponse.json()) as Status);
    if (docsResponse.ok) {
      const payload = (await docsResponse.json()) as { documents: KnowledgeDocument[] };
      setDocs(payload.documents);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || streaming) return;

    const assistantId = makeId();
    setMessages((previous) => [
      ...previous,
      { id: makeId(), role: "user", content: trimmed, createdAt: new Date().toISOString() },
      { id: assistantId, role: "assistant", content: "", createdAt: new Date().toISOString() },
    ]);
    setInput("");
    setStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, history: messages }),
      });
      if (!response.ok || !response.body) throw new Error("Chat request failed");

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
          const event = JSON.parse(line.slice(6)) as StreamEvent;
          setMessages((previous) =>
            previous.map((message) => {
              if (message.id !== assistantId) return message;
              if (event.type === "delta") {
                return { ...message, content: message.content + (event.text ?? "") };
              }
              if (event.type === "sources" && event.sources) {
                return { ...message, sources: event.sources };
              }
              return message;
            }),
          );
        }
      }
    } catch {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId
            ? { ...message, content: "Sorry — something went wrong. Please try again." }
            : message,
        ),
      );
    } finally {
      setStreaming(false);
    }
  }

  const isLive = status?.mode === "neon-ai-gateway";

  return (
    <div className="flex h-screen overflow-hidden">
      {showDocs ? (
        <button
          type="button"
          aria-label="Close knowledge panel"
          onClick={() => setShowDocs(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-80 shrink-0 flex-col border-r border-line bg-panel/95 backdrop-blur lg:static lg:z-auto lg:bg-panel/50 lg:backdrop-blur-none ${
          showDocs ? "flex" : "hidden lg:flex"
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand/15 text-brand ring-1 ring-brand/30">
            <BrainCircuit className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-[0.16em] text-ink">ASKLY</p>
            <p className="text-[10px] uppercase tracking-widest text-muted">RAG assistant</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMessages([])}
          className="mx-4 mt-4 flex items-center justify-center gap-2 rounded-xl border border-line bg-panel2/70 px-3 py-2.5 text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          <MessageSquarePlus className="size-4" /> New conversation
        </button>
        <div className="min-h-0 flex-1">
          <DocumentPanel docs={docs} status={status} onChanged={() => void refresh()} onClose={() => setShowDocs(false)} />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 lg:px-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDocs(true)}
              aria-label="Open knowledge panel"
              className="flex size-8 items-center justify-center rounded-lg border border-line text-muted lg:hidden"
            >
              <BookOpen className="size-4" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-ink lg:text-base">Ask your knowledge base</h1>
              <p className="text-[11px] text-muted">Grounded answers, cited from your sources</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ${
              isLive ? "bg-brand/10 text-brand ring-brand/20" : "bg-accent/10 text-accent ring-accent/20"
            }`}
          >
            <span className={`size-1.5 rounded-full ${isLive ? "bg-brand" : "bg-accent"}`} />
            {isLive ? "Live AI" : "Local mode"}
          </span>
        </header>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/25">
                <BrainCircuit className="size-7" />
              </div>
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-ink">
                Ask anything about your documents
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                Add documents in the knowledge panel, or load the sample set, then ask a question. Every answer comes with its sources.
              </p>
              <div className="mt-7 grid w-full gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void ask(suggestion)}
                    className="rounded-xl border border-line bg-panel2/60 px-4 py-3 text-left text-xs text-muted transition-colors hover:border-brand/40 hover:text-ink"
                  >
                    <FileText className="mb-2 size-3.5 text-brand" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
          {messages.length === 0 ? <div ref={bottomRef} /> : null}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void ask(input);
          }}
          className="border-t border-line bg-canvas/60 px-4 py-4 lg:px-8"
        >
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-line bg-panel2/80 p-2 focus-within:border-brand/40">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void ask(input);
                }
              }}
              rows={1}
              placeholder="Ask a question about your documents…"
              className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              aria-label="Send question"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-canvas transition-colors hover:bg-brand/85 disabled:opacity-40"
            >
              {streaming ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
            </button>
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-muted">
            Answers are generated only from your knowledge base · Press Enter to send, Shift+Enter for a new line
          </p>
        </form>
      </main>
    </div>
  );
}
