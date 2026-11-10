import type { ReactNode } from "react";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import type { StaffRole } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles: StaffRole[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Beranda", icon: "home", roles: ["owner", "admin", "apoteker", "asisten_apoteker"] },
  { href: "/apoteker/resep", label: "Validasi Resep", icon: "prescription", roles: ["apoteker"] },
  { href: "/apoteker/permintaan", label: "Permintaan Obat", icon: "requests", roles: ["admin", "apoteker", "asisten_apoteker"] },
  { href: "/apoteker/obat", label: "Data Obat", icon: "medicine", roles: ["owner", "admin", "apoteker", "asisten_apoteker"] },
  { href: "/apoteker/stok", label: "Stok Obat", icon: "stock", roles: ["owner", "admin", "apoteker", "asisten_apoteker"] },
  { href: "/apoteker/transaksi", label: "Kasir POS", icon: "sales", roles: ["admin", "apoteker", "asisten_apoteker"] },
  { href: "/apoteker/riwayat-transaksi", label: "Riwayat Transaksi", icon: "history", roles: ["owner", "admin", "apoteker", "asisten_apoteker"] },
  { href: "/apoteker/laporan", label: "Laporan", icon: "report", roles: ["owner", "admin", "apoteker", "asisten_apoteker"] },
  { href: "/apoteker/akun", label: "Akun Saya", icon: "account", roles: ["owner", "admin", "apoteker", "asisten_apoteker"] },
];

const ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Owner",
  admin: "Admin",
  apoteker: "Apoteker",
  asisten_apoteker: "Asisten Apoteker",
};

function Icon({ name }: { name: string }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  if (name === "home") return <svg {...common}><path d="M3 11.5 12 4l9 7.5M5.5 10v10h13V10M9.5 20v-6h5v6" /></svg>;
  if (name === "prescription") return <svg {...common}><path d="M5 7h14M5 17h14" /><circle cx="9" cy="7" r="2.5" /><circle cx="15" cy="17" r="2.5" /></svg>;
  if (name === "medicine") return <svg {...common}><path d="m8 4 12 12a4 4 0 0 1-6 6L2 10a4 4 0 0 1 6-6ZM7 15l6-6" /></svg>;
  if (name === "report") return <svg {...common}><path d="M5 3h10l4 4v14H5zM15 3v5h4M8 12h8M8 16h8" /></svg>;
  if (name === "stock") return <svg {...common}><path d="m12 3 9 5v8l-9 5-9-5V8zM3 8l9 5 9-5M12 13v8M8 5l9 5" /></svg>;
  if (name === "requests") return <svg {...common}><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></svg>;
  if (name === "sales") return <svg {...common}><path d="M4 5h16v15H4zM8 3v4M16 3v4M4 10h16M8 14h3M8 17h6" /></svg>;
  if (name === "history") return <svg {...common}><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8M3 4v4h4M12 7v5l3 2" /></svg>;
  if (name === "account") return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
  return <svg {...common}><path d="M10 17H5V5h12v5M9 12l-5 5 5 5M4 17h11a5 5 0 0 0 5-5v-1" /></svg>;
}

export function ApotekerShell({
  children,
  active,
  name,
  role = "apoteker",
}: {
  children: ReactNode;
  active: string;
  name: string;
  role?: StaffRole;
}) {
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const roleLabel = ROLE_LABELS[role] ?? "Apoteker";

  return (
    <main className="pharmacist-app">
      <header className="pharmacist-header">
        <Link href="/" className="pharmacist-brand">
          <span className="pharmacist-brand-mark">
            <span aria-hidden="true">⌁</span>
          </span>
          <span>
            <b>APOTEK SRI UTAMA</b>
            <small>Sehat Bersama, Setiap Saat</small>
          </span>
        </Link>
        <div className="pharmacist-user">
          <span className="pharmacist-avatar">{name.slice(0, 1).toUpperCase()}</span>
          <span>
            {name}
            <small>{roleLabel}</small>
          </span>
        </div>
      </header>
      <div className="pharmacist-layout">
        <aside className="pharmacist-sidebar">
          <nav aria-label={`Navigasi ${roleLabel}`}>
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`pharmacist-nav-link${active === item.href ? " active" : ""}`}
                aria-current={active === item.href ? "page" : undefined}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <form action={logout} className="pharmacist-side-logout">
            <button type="submit">
              <Icon name="logout" />
              <span>Keluar</span>
            </button>
          </form>
        </aside>
        <section className="pharmacist-content">{children}</section>
      </div>
    </main>
  );
}

export function PageHeading({ eyebrow = "SISTEM APOTEK", title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="pharmacist-page-heading">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      {description && <span>{description}</span>}
    </div>
  );
}
