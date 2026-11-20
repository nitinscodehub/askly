"use client";

import { useState } from "react";
import { FileText, Sparkles, User } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index} className="font-semibold text-ink">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const [openSource, setOpenSource] = useState<number | null>(null);
  const isUser = message.role === "user";

  return (
    <article className={`rise flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-xl ring-1 ${
          isUser
            ? "bg-panel2 text-muted ring-line"
            : "bg-brand/15 text-brand ring-brand/30"
        }`}
      >
        {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
      </div>

      <div className={`min-w-0 max-w-3xl ${isUser ? "items-end" : ""} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-md bg-brand/15 text-ink ring-1 ring-brand/25"
              : "rounded-tl-md border border-line bg-panel2/80 text-ink"
          }`}
        >
          {message.content ? (
            message.content.split("\n\n").map((paragraph, index) => (
              <p key={index} className={index ? "mt-3" : ""}>
                <InlineText text={paragraph} />
              </p>
            ))
          ) : (
            <span className="inline-flex gap-1 py-1">
              <span className="typing-dot size-1.5 rounded-full bg-brand" />
              <span className="typing-dot size-1.5 rounded-full bg-brand [animation-delay:150ms]" />
              <span className="typing-dot size-1.5 rounded-full bg-brand [animation-delay:300ms]" />
            </span>
          )}
        </div>

        {message.sources?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.sources.map((source, index) => (
              <div key={`${source.docId}-${index}`}>
                <button
                  type="button"
                  onClick={() => setOpenSource(openSource === index ? null : index)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel/70 px-2 py-1 text-[10px] text-muted transition-colors hover:border-brand/40 hover:text-brand"
                >
                  <FileText className="size-3" />
                  [{index + 1}] {source.docName}
                </button>
                {openSource === index ? (
                  <p className="mt-1.5 rounded-lg border border-line bg-canvas/70 p-2.5 text-[11px] leading-relaxed text-muted">
                    {source.text.slice(0, 420)}
                    {source.text.length > 420 ? "…" : ""}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
