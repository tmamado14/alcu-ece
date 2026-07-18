import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

const FEATURES: [string, string, string][] = [
  ["🎯", "Adaptive", "Problems match your current topic rating — never too easy, never crushing."],
  ["🧠", "Two tries", "Miss once and you get another shot. Full step-by-step solutions after."],
  ["🏆", "Gamified", "XP, levels, quests, badges, and mastery bars that actually mean something."],
];

export default async function LandingPage() {
  const user = await getSessionUser();
  return (
    <div className="py-14 text-center">
      <p className="eyebrow">Adaptive practice for ECE</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        Master ECE, <span className="text-brand-600">one problem at a time</span>
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
        ECE Mastery is an adaptive practice platform for Electronics Engineering. Answer problems,
        build topic mastery, earn XP and badges, and watch your weak spots turn green.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        {user ? (
          <>
            <Link href="/practice" className="btn-primary btn-lg">
              Continue practicing
            </Link>
            <Link href="/dashboard" className="btn-secondary btn-lg">
              Dashboard
            </Link>
          </>
        ) : (
          <Link href="/login" className="btn-primary btn-lg">
            Get started
          </Link>
        )}
      </div>
      <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-5 text-left sm:grid-cols-3">
        {FEATURES.map(([icon, title, body]) => (
          <div key={title} className="card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-xl" aria-hidden>
              {icon}
            </div>
            <h3 className="mt-3 font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
