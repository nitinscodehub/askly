import { NextResponse, type NextRequest } from "next/server";
import { SAMPLE_DOCUMENTS } from "@/lib/sample-docs";
import { addDocument } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      content?: string;
      sample?: boolean;
    };

    if (body.sample) {
      const documents = [];
      for (const item of SAMPLE_DOCUMENTS) {
        documents.push(await addDocument(item.name, item.content));
      }
      return NextResponse.json({ documents, count: documents.length });
    }

    const name = body.name?.trim().slice(0, 120);
    const content = body.content?.trim();
    if (!name || !content) {
      return NextResponse.json(
        { error: "Both a document name and content are required" },
        { status: 400 },
      );
    }

    const document = await addDocument(name, content);
    return NextResponse.json({ document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingestion failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
