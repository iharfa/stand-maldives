import { isAdmin } from "../../lib/auth";
import { Submissions } from "../../lib/db";
import { isOpen } from "../../lib/rules";
import AdminLogin from "./AdminLogin";
import AdminShell from "./AdminShell";
import "./admin.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

// Next renders this layout and the page in parallel, and a page's output reaches the browser even when the layout
// shows the login form instead of {children}. So every admin page also checks isAdmin() itself (as in zwm-site).
export default async function AdminLayout({ children }) {
  if (!(await isAdmin())) return <AdminLogin />;
  const pending = (await Submissions.list()).filter(isOpen).length;
  return <AdminShell pending={pending}>{children}</AdminShell>;
}
