import { NextResponse } from "next/server";
import { report } from "@/server/repository";

export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json(report((await params).id), {
      headers: { "Content-Disposition": "attachment; filename=interview-dojo-report.json" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cannot export report" },
      { status: 404 },
    );
  }
}
