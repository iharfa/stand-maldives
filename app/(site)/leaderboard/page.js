import { getSiteData } from "../../../lib/site";
import LeaderboardView from "./LeaderboardView";

export const revalidate = 300;
export const metadata = { title: "Top 10 resorts" };

export default async function LeaderboardPage() {
  const { content, resorts, figures } = await getSiteData();
  return <LeaderboardView resorts={resorts} figures={figures} site={content.site} text={content.leaderboard} />;
}
