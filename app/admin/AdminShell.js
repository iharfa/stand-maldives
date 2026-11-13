"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  ["/admin", "Review queue"],
  ["/admin/figures", "Published figures"],
  ["/admin/resorts", "Resorts"],
  ["/admin/content", "Site content"],
];

export default function AdminShell({ children, pending }) {
  const path = usePathname();
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }
  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="admin-brand">
          <img src="/logo.png" alt="" width={32} height={32} />
          <span>Stand Maldives<small>ADMIN</small></span>
        </div>
        <nav className="admin-nav" aria-label="Admin">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>
              {label}
              {href === "/admin" && pending > 0 && <span className="admin-badge" aria-label={`${pending} pending`}>{pending}</span>}
            </Link>
          ))}
        </nav>
        <div className="admin-foot">
          <a href="/" target="_blank" rel="noreferrer">View site ↗</a>
          <button type="button" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
