import { isAdmin } from "../../../lib/auth";
import { getSiteData } from "../../../lib/site";
import ResortsAdmin from "./ResortsAdmin";

export const dynamic = "force-dynamic";

export default async function ResortsPage() {
  if (!(await isAdmin())) return null; // see ../layout.js
  const { resorts, figures } = await getSiteData();
  const counts = {};
  for (const f of figures) counts[f.resort_id] = (counts[f.resort_id] || 0) + 1;
  return <ResortsAdmin resorts={resorts.map((r) => ({ ...r, figures: counts[r.id] || 0 }))} />;
}
