import { adminRoute, readJson } from "../../../../lib/adminApi";
import { Settings } from "../../../../lib/db";
import { SECTIONS, sanitizeSection } from "../../../../lib/content";
import { ValidationError } from "../../../../lib/validate";

// Saves one section of site content (see lib/content.js).
export const POST = adminRoute(async (req) => {
  const { key, value } = await readJson(req);
  if (!Object.hasOwn(SECTIONS, key)) throw new ValidationError("Unknown section");
  return { value: await Settings.set(key, sanitizeSection(key, value)) };
});
