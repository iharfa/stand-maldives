import { readImage } from "../../../../lib/upload";

// Public site images uploaded from the admin (e.g. the logo).
export async function GET(_req, { params }) {
  const file = await readImage((await params).name);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(file.body, { headers: { "Content-Type": file.type, "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=31536000, immutable" } });
}
