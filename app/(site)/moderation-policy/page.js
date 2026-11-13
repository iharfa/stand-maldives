import LegalPage, { legalMetadata } from "../../components/LegalPage";

export const revalidate = 300;
export const generateMetadata = () => legalMetadata("moderation");

export default function Page() {
  return <LegalPage section="moderation" />;
}
