"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/subjects", label: "Subjects" },
  { href: "/practice", label: "Practice" },
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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-indigo-700">
          ⚡ ECE Mastery
        </Link>
        {user && (
          <nav className="flex flex-wrap gap-1 text-sm">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded px-2 py-1 hover:bg-indigo-50 ${
                  pathname?.startsWith(l.href) ? "bg-indigo-100 font-semibold text-indigo-800" : "text-slate-600"
                }`}
              >
                {l.label}
              </Link>
            ))}
            {user.role === "admin" && (
              <Link
                href="/admin"
                className={`rounded px-2 py-1 hover:bg-amber-50 ${
                  pathname?.startsWith("/admin") ? "bg-amber-100 font-semibold text-amber-800" : "text-amber-700"
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
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-800">
                {user.totalXp} XP
              </span>
              <Link href="/settings" className="text-slate-600 hover:text-slate-900">
                {user.name}
              </Link>
              <button onClick={logout} className="text-slate-400 hover:text-slate-700">
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" className="rounded bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-700">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
