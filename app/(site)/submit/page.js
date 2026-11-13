import { getSiteData } from "../../../lib/site";
import SubmitForm from "./SubmitForm";

export const revalidate = 300;
export const metadata = { title: "Submit service charge" };

export default async function SubmitPage() {
  const { content, resorts } = await getSiteData();
  const text = content.submit;
  return (
    <section className="wrap section submit-grid">
      <SubmitForm resorts={resorts} text={text} />
      <aside className="aside">
        <span className="aside-title">{text.asideTitle}</span>
        {text.asidePoints.map((p, i) => (
          <div key={i}><strong>{p.title}</strong><p>{p.desc}</p></div>
        ))}
      </aside>
    </section>
  );
}
