import { NextResponse } from "next/server";
import { trends } from "@/server/repository";

export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json({ trends: trends() });
}
