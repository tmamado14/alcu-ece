import type { Metadata } from "next";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "ECE Mastery",
  description: "Adaptive practice for Electronics Engineering",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <Nav user={user ? { name: user.name, role: user.role, totalXp: user.totalXp } : null} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <footer className="border-t border-line bg-surface py-4">
          <p className="mx-auto max-w-6xl px-4 text-xs text-ink-faint sm:px-6">
            ECE Mastery — adaptive practice for Electronics Engineering
          </p>
        </footer>
      </body>
    </html>
  );
}
