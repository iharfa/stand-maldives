"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Resort pages count as part of the database section.
export default function NavLinks({ items }) {
  const path = usePathname();
  const active = path.startsWith("/resorts") ? "/" : path;
  return (
    <nav className="nav" aria-label="Main">
      {items.map(([href, label]) => (
        <Link key={href} href={href} aria-current={active === href ? "page" : undefined}>{label}</Link>
      ))}
    </nav>
  );
}
