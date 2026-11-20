import { NextResponse, type NextRequest } from "next/server";
import { clearDocuments, deleteDocument, listDocuments } from "@/lib/store";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ documents: listDocuments() });
}

export function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (id) deleteDocument(id);
  else clearDocuments();
  return NextResponse.json({ ok: true });
}
