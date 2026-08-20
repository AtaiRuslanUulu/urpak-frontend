"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HiMenu, HiX } from "react-icons/hi";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/components/AuthProvider";

const PUBLIC_LINKS = [
  { href: "/", label: "Варианты" },
  { href: "/rent", label: "Аренда" },
];

const AGENT_LINKS = [
  { href: "/trash", label: "Удаленные" },
  { href: "/invoices", label: "Счета" },
];

const MANAGER_LINKS = [{ href: "/settings/agents", label: "Настройки" }];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || "/favicon.ico";

  const links = user
    ? [
        ...PUBLIC_LINKS,
        ...AGENT_LINKS,
        ...(user.is_manager ? MANAGER_LINKS : []),
      ]
    : PUBLIC_LINKS;

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        className={`text-sm ${active ? "text-fg" : "text-muted hover:text-fg"}`}
        onClick={() => setOpen(false)}
      >
        {label}
      </Link>
    );
  };

  const AuthControl = () => {
    if (user) {
      return (
        <button
          onClick={() => {
            logout();
            setOpen(false);
          }}
          className="text-sm text-muted hover:text-fg"
          title={user.agent?.full_name || user.username}
        >
          Выйти
        </button>
      );
    }
    return <NavLink href="/login" label="Вход" />;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={LOGO_URL}
            alt="URPAK.KG"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="text-base font-semibold">URPAK.KG</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
          {user && (
            <NavLink href="/profile" label={user.agent?.full_name || user.username} />
          )}
          <AuthControl />
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Меню"
          >
            {open ? <HiX size={20} /> : <HiMenu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-card md:hidden">
          <div className="mx-auto max-w-6xl px-4 py-3 md:px-6">
            <ul className="flex flex-col gap-3">
              {links.map((link) => (
                <li key={link.href}>
                  <NavLink {...link} />
                </li>
              ))}
              {user && (
                <li>
                  <NavLink
                    href="/profile"
                    label={user.agent?.full_name || user.username}
                  />
                </li>
              )}
              <li>
                <AuthControl />
              </li>
            </ul>
          </div>
        </nav>
      )}
    </header>
  );
}
