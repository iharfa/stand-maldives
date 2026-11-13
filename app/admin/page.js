import { isAdmin } from "../../lib/auth";
import { Resorts, Submissions, ref } from "../../lib/db";
import { getContent } from "../../lib/site";
import QueueAdmin from "./QueueAdmin";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  if (!(await isAdmin())) return null; // see layout.js
  const [subs, resorts, content] = await Promise.all([Submissions.list(), Resorts.list(), getContent()]);
  const submissions = subs.map((s) => ({
    ...s, ref: ref(s.id), amount: Number(s.amount), created_at: new Date(s.created_at).toISOString(),
    evidence: s.evidence || [], log: s.log || [],
  }));
  return <QueueAdmin submissions={submissions} resorts={resorts.map((r) => ({ ...r }))} rate={Number(content.site.rate) || 15.42} />;
}
