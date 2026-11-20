"use client";

import { useRef, useState } from "react";
import {
  BookOpen,
  FileText,
  Layers3,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { KnowledgeDocument } from "@/lib/types";

type Status = { mode: string; documents: number; chunks: number } | null;

type Props = {
  docs: KnowledgeDocument[];
  status: Status;
  onChanged: () => void;
  onClose?: () => void;
};

export default function DocumentPanel({ docs, status, onChanged, onClose }: Props) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const isLive = status?.mode === "neon-ai-gateway";

  async function post(payload: object) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not add document");
      setName("");
      setContent("");
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    setName(file.name);
    setContent(text);
  }

  async function remove(id?: string) {
    setBusy(true);
    await fetch(`/api/documents${id ? `?id=${encodeURIComponent(id)}` : ""}`, {
      method: "DELETE",
    });
    setBusy(false);
    onChanged();
  }

  return (
    <div className="scroll-thin flex h-full flex-col overflow-y-auto px-4 py-5">
      <div className="mb-5 flex items-center justify-between lg:hidden">
        <p className="text-sm font-semibold text-ink">Knowledge base</p>
        <button type="button" onClick={onClose} aria-label="Close panel" className="text-muted">
          <X className="size-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-panel2/70 p-4">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${isLive ? "bg-brand" : "bg-accent"}`} />
          <p className="text-xs font-semibold text-ink">
            {isLive ? "Neon AI Gateway" : "Local retrieval mode"}
          </p>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          {isLive
            ? "Live embeddings and streaming LLM answers are active."
            : "Deterministic embeddings + extractive answers. Add gateway keys for full AI."}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-canvas/50 p-2">
            <p className="text-lg font-bold text-ink">{status?.documents ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted">Documents</p>
          </div>
          <div className="rounded-lg bg-canvas/50 p-2">
            <p className="text-lg font-bold text-ink">{status?.chunks ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted">Chunks</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void post({ sample: true })}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-3 py-2.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/20 disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <BookOpen className="size-4" />}
        Load sample knowledge base
      </button>

      <div className="mt-5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Add a document
        </p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Document name"
          className="w-full rounded-xl border border-line bg-canvas/60 px-3 py-2 text-xs text-ink outline-none placeholder:text-muted focus:border-brand/40"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Paste text or load a .txt / .md file…"
          rows={5}
          className="mt-2 w-full resize-none rounded-xl border border-line bg-canvas/60 px-3 py-2 text-xs leading-relaxed text-ink outline-none placeholder:text-muted focus:border-brand/40"
        />
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.markdown,text/plain"
          className="hidden"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line px-2 py-2 text-[11px] text-muted transition-colors hover:text-ink"
          >
            <Upload className="size-3.5" /> File
          </button>
          <button
            type="button"
            disabled={busy || !name.trim() || !content.trim()}
            onClick={() => void post({ name, content })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand px-2 py-2 text-[11px] font-semibold text-canvas transition-colors hover:bg-brand/85 disabled:opacity-40"
          >
            <Plus className="size-3.5" /> Add
          </button>
        </div>
        {error ? <p className="mt-2 text-[11px] text-rose-400">{error}</p> : null}
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Sources ({docs.length})
          </p>
          {docs.length ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove()}
              className="text-[10px] text-muted transition-colors hover:text-rose-400"
            >
              Clear all
            </button>
          ) : null}
        </div>
        <div className="space-y-2">
          {docs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-4 text-center text-[11px] text-muted">
              No documents yet. Load the sample set to start asking questions.
            </p>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-center gap-2 rounded-xl border border-line bg-panel2/50 p-2.5"
              >
                <FileText className="size-3.5 shrink-0 text-brand" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-ink">{doc.name}</p>
                  <p className="text-[10px] text-muted">{doc.chunks} chunks</p>
                </div>
                <button
                  type="button"
                  onClick={() => void remove(doc.id)}
                  aria-label={`Delete ${doc.name}`}
                  className="text-muted opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-line bg-canvas/40 p-3 text-[10px] text-muted">
        <Layers3 className="size-4 shrink-0 text-accent" />
        Chunks are embedded, ranked by cosine similarity, and cited in every answer.
      </div>
    </div>
  );
}
