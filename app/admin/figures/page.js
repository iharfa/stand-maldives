import { isAdmin } from "../../../lib/auth";
import { getSiteData } from "../../../lib/site";
import FiguresAdmin from "./FiguresAdmin";

export const dynamic = "force-dynamic";

export default async function FiguresPage() {
  if (!(await isAdmin())) return null; // see ../layout.js
  const { resorts, figures } = await getSiteData();
  return <FiguresAdmin resorts={resorts} figures={figures} />;
}
