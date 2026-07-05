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
      <body className="min-h-screen antialiased">
        <Nav user={user ? { name: user.name, role: user.role, totalXp: user.totalXp } : null} />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
