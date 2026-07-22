import { NextResponse } from "next/server";
import { createSession } from "@/server/repository";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { questionId?: string };
    if (!body.questionId) throw new Error("questionId is required");
    return NextResponse.json({ session: createSession(body.questionId) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cannot create session" },
      { status: 400 },
    );
  }
}
