import { NextRequest, NextResponse } from "next/server";
import { runPublicResearch } from "@/lib/research";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }
  try {
    const result = await runPublicResearch(q);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Research failed" }, { status: 500 });
  }
}
