import Link from "next/link";
import { getContent } from "../../lib/site";
import NavLinks from "../components/NavLinks";

export default async function SiteLayout({ children }) {
  const { site } = await getContent();
  const logo = site.logo || "/logo.png";
  return (
    <div className="page">
      <header className="site-header">
        <div className="wrap header-inner">
          <Link href="/" className="brand">
            <img src={logo} alt="" width={42} height={42} />
            <span className="brand-text">
              <span className="brand-name">{site.name}</span>
              <span className="brand-tag">{site.tagline}</span>
            </span>
          </Link>
          <NavLinks items={[["/", site.navDatabase], ["/leaderboard", site.navLeaderboard]]} />
          <Link href="/submit" className="btn btn-ink header-cta">{site.submitButton}</Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="wrap footer-inner">
          <div className="footer-brand">
            <img src={logo} alt="" width={28} height={28} />
            <strong>{site.name}</strong>
            <span>{site.footerContact}</span>
          </div>
          <nav className="footer-links" aria-label="Legal">
            <Link href="/terms">Terms</Link>
            <Link href="/moderation-policy">Moderation policy</Link>
            <Link href="/privacy">Privacy</Link>
          </nav>
          {site.footerNote && <span style={{ width: "100%" }}>{site.footerNote}</span>}
        </div>
      </footer>
    </div>
  );
}
