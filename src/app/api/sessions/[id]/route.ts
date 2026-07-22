import { NextResponse } from "next/server";
import { getSession, saveAnswer, saveRubric, setExportPrivacy } from "@/server/repository";

export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const detail = getSession((await params).id);
  return detail
    ? NextResponse.json(detail)
    : NextResponse.json({ error: "Session not found" }, { status: 404 });
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const body = (await request.json()) as {
      action?: string;
      content?: string;
      scores?: Array<{ criterionId: string; score: number; note: string }>;
      includeAnswer?: boolean;
    };
    if (body.action === "answer")
      return NextResponse.json({ answer: saveAnswer(id, body.content ?? "") });
    if (body.action === "rubric")
      return NextResponse.json({ rubric: saveRubric(id, body.scores ?? []) });
    if (body.action === "privacy" && typeof body.includeAnswer === "boolean") {
      setExportPrivacy(id, body.includeAnswer);
      return NextResponse.json({ ok: true });
    }
    throw new Error("Unsupported action");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cannot update session" },
      { status: 400 },
    );
  }
}
