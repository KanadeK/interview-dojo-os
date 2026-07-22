import { NextResponse } from "next/server";
import { importPack, listQuestions } from "@/server/repository";

export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json({ questions: listQuestions() });
}
export async function POST(request: Request) {
  try {
    return NextResponse.json(importPack(await request.json()), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid question pack" },
      { status: 400 },
    );
  }
}
