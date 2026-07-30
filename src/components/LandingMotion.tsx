"use client";

// Landing-page motion: sections fade up as they enter, progress bars fill to
// their `data-fill` width, and the hero card replays its +XP pop and rating
// count-up. Everything here is decorative — the page reads fine without it,
// and prefers-reduced-motion skips the animated parts entirely.

import { useEffect } from "react";

export default function LandingMotion() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: ReturnType<typeof setInterval>[] = [];

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          io.unobserve(el);
          el.classList.add("in");
          el.querySelectorAll<HTMLElement>("[data-fill]").forEach((fill) => {
            fill.style.width = fill.dataset.fill ?? "0";
          });

          if (el.hasAttribute("data-xp-host") && !reduce) {
            const xp = el.querySelector<HTMLElement>("[data-xp]");
            const rating = el.querySelector<HTMLElement>("[data-rating]");
            const run = () => {
              if (xp) {
                xp.removeAttribute("data-pop");
                void xp.offsetWidth; // restart the animation
                xp.setAttribute("data-pop", "");
              }
              if (rating) {
                let n = 1042;
                const tick = setInterval(() => {
                  n += 1;
                  rating.textContent = String(n);
                  if (n >= 1061) clearInterval(tick);
                }, 45);
                timers.push(tick);
              }
            };
            run();
            timers.push(setInterval(run, 6000));
          }
        }
      },
      { threshold: 0.2 }
    );

    document
      .querySelectorAll(".il .fade-up, .il [data-xp-host]")
      .forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      timers.forEach(clearInterval);
    };
  }, []);

  return null;
}
