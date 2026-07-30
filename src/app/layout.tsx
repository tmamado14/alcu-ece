import type { Metadata } from "next";
import Link from "next/link";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { CURRENT_VERSION } from "@/lib/changelog";
import Nav from "@/components/Nav";

// The Industry typeface pair: Barlow for body, Barlow Condensed for headings.
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ECE Mastery",
  description: "Adaptive practice for Electronics Engineering",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <Nav user={user ? { name: user.name, role: user.role, totalXp: user.totalXp } : null} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <footer className="border-t border-line bg-surface py-4">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 text-xs tracking-[0.08em] uppercase sm:px-6">
            <p className="text-ink-faint">ECE Mastery — adaptive practice for Electronics Engineering</p>
            <Link href="/changelog" className="ml-auto font-semibold text-ink-muted hover:text-brand-700">
              Patch notes <span className="tnum">v{CURRENT_VERSION}</span>
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
