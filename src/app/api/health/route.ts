import { NextResponse } from "next/server";
import { isLiveMode } from "@/lib/gateway";
import { listDocuments } from "@/lib/store";

export const dynamic = "force-dynamic";

export function GET() {
  const documents = listDocuments();

  return NextResponse.json({
    status: "ok",
    service: "askly",
    mode: isLiveMode() ? "neon-ai-gateway" : "local-fallback",
    documents: documents.length,
    chunks: documents.reduce((sum, document) => sum + document.chunks, 0),
    time: new Date().toISOString(),
  });
}
