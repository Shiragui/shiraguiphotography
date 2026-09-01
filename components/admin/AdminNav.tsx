"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/contract-template", label: "Contract template" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      {links.map((link) => {
        const active =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              textDecoration: "none",
              fontWeight: 600,
              color: active ? "#005987" : "#39454b",
              borderBottom: active ? "2px solid #005987" : "2px solid transparent",
              paddingBottom: "0.15rem",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
