import { adminRoute } from "../../../../lib/adminApi";
import { saveImage, UploadError } from "../../../../lib/upload";
import { ValidationError } from "../../../../lib/validate";

export const POST = adminRoute(async (req) => {
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!file || typeof file !== "object") throw new ValidationError("No file");
  try {
    return { url: await saveImage(file) };
  } catch (e) {
    throw e instanceof UploadError ? new ValidationError(e.message) : e;
  }
});
