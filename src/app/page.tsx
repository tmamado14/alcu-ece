import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

export default async function LandingPage() {
  const user = await getSessionUser();
  return (
    <div className="py-12 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
        Master ECE, <span className="text-indigo-600">one problem at a time</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
        ECE Mastery is an adaptive practice platform for Electronics Engineering. Answer problems,
        build topic mastery, earn XP and badges, and watch your weak spots turn green.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        {user ? (
          <>
            <Link href="/practice" className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
              Continue practicing
            </Link>
            <Link href="/dashboard" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50">
              Dashboard
            </Link>
          </>
        ) : (
          <Link href="/login" className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
            Get started
          </Link>
        )}
      </div>
      <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-6 text-left sm:grid-cols-3">
        {[
          ["🎯 Adaptive", "Problems match your current topic rating — never too easy, never crushing."],
          ["🧠 Two tries", "Miss once and you get another shot. Full step-by-step solutions after."],
          ["🏆 Gamified", "XP, levels, quests, badges, and mastery bars that actually mean something."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
