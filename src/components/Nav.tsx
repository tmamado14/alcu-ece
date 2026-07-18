"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/subjects", label: "Subjects" },
  { href: "/practice", label: "Practice" },
  { href: "/report", label: "Report" },
  { href: "/history", label: "History" },
  { href: "/quests", label: "Quests" },
  { href: "/achievements", label: "Achievements" },
];

export default function Nav({
  user,
}: {
  user: { name: string; role: string; totalXp: number } | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-ink"
        >
          <span aria-hidden className="text-brand-600">⚡</span>
          ECE <span className="text-brand-600">Mastery</span>
        </Link>
        {user && (
          <nav aria-label="Primary" className="flex flex-wrap gap-1 text-sm">
            {LINKS.map((l) => {
              const active = pathname?.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3 py-1.5 font-medium transition ${
                    active
                      ? "bg-brand-600 text-white shadow-xs"
                      : "text-ink-muted hover:bg-brand-50 hover:text-brand-700"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            {user.role === "admin" && (
              <Link
                href="/admin"
                aria-current={pathname?.startsWith("/admin") ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 font-medium transition ${
                  pathname?.startsWith("/admin")
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-amber-700 hover:bg-amber-50"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="chip-brand" title="Total experience points">
                {user.totalXp} XP
              </span>
              <Link
                href="/settings"
                className="font-medium text-ink-muted transition hover:text-ink"
                title="Profile & settings"
              >
                {user.name}
              </Link>
              <button onClick={logout} className="btn-ghost btn-sm">
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary btn-sm">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
