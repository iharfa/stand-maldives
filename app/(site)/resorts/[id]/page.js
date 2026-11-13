import { notFound } from "next/navigation";
import { getSiteData } from "../../../../lib/site";
import ResortView from "./ResortView";

export const revalidate = 300;

async function load(params) {
  const { id } = await params;
  const data = await getSiteData();
  const resort = data.resorts.find((r) => r.id === Number(id));
  return resort ? { ...data, resort, figures: data.figures.filter((f) => f.resort_id === resort.id) } : null;
}

export async function generateMetadata({ params }) {
  const d = await load(params);
  return d ? { title: d.resort.name, description: `Service charge paid by ${d.resort.name}, ${d.resort.atoll}.` } : {};
}

export default async function ResortPage({ params }) {
  const d = await load(params);
  if (!d) notFound();
  return <ResortView resort={d.resort} figures={d.figures} site={d.content.site} text={d.content.resort} />;
}
