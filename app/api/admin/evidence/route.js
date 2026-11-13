import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/auth";
import { readEvidence } from "../../../../lib/upload";

// Admin-only viewer for private evidence files.
export async function GET(req) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const file = await readEvidence(new URL(req.url).searchParams.get("k") || "");
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new Response(file.body, { headers: { "Content-Type": file.type, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store", "Content-Disposition": "inline" } });
}
