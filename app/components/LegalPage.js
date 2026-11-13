import { getContent } from "../../lib/site";

export async function legalMetadata(key) {
  return { title: (await getContent())[key].title };
}

export default async function LegalPage({ section }) {
  const { title, body } = (await getContent())[section];
  return (
    <section className="wrap section prose">
      <h1 className="display">{title}</h1>
      {body.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}
    </section>
  );
}
