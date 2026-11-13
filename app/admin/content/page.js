import { isAdmin } from "../../../lib/auth";
import { Settings } from "../../../lib/db";
import { withDefaults } from "../../../lib/content";
import ContentAdmin from "./ContentAdmin";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  if (!(await isAdmin())) return null; // see ../layout.js
  return <ContentAdmin initial={withDefaults(await Settings.all())} />;
}
