# Badge Image Generation Guide

The app looks for badge art at these exact paths (PNG, transparent background, square — 512×512 recommended). Until a file exists, the UI falls back to the achievement's emoji icon, so you can generate them incrementally.

- Achievements: `public/badges/achievements/<slug>.png`
- Quests: `public/badges/quests/<slug>.png`

## Prompt template

Keep the style block identical for every badge so the set looks cohesive; swap only the `Tier` and `Emblem subject` lines. Generate all badges in the same session/thread if your generator supports it, and always keep "no text".

```
A circular game achievement badge icon, flat modern vector style with subtle
gradients and a thin metallic rim, centered emblem, clean silhouette readable
at small sizes, dark transparent background, no text, no letters, 512x512.

Tier: {TIER} — rim and accent colors in {TIER_COLOR} tones.

Emblem subject: {EMBLEM}.

Theme: electronics and communications engineering — circuit traces, waveforms,
resistors, antennas, chips as decorative motifs.
```

Tier colors:

| Tier | TIER_COLOR |
|---|---|
| bronze | warm copper-brown |
| silver | cool steel-gray |
| gold | rich amber-gold |
| platinum | iridescent white-blue with prismatic highlights |

## Achievements (51)

Save each as `public/badges/achievements/<slug>.png`.

| slug | name | tier | emblem subject |
|---|---|---|---|
| first-try-first-win | First Try, First Win | bronze | a single checkmark striking like a lightning bolt onto a fresh circuit board |
| step-input | Step Input | bronze | a step-function waveform rising on a small oscilloscope screen |
| mistake-repaired | Mistake Repaired | bronze | a soldering iron mending a broken circuit trace that now glows |
| persistence-pays | Persistence Pays | bronze | a second arrow hitting the bullseye after a first arrow missed |
| gain-of-ten | Gain of Ten | bronze | an op-amp triangle symbol with ten small energy sparks around it |
| grinder-in-the-loop | Grinder in the Loop | bronze | a gear meshed into a closed feedback-loop arrow circuit |
| locked-on | Locked On | bronze | a crosshair locked onto a clean sine wave |
| warming-up | Warming Up | bronze | three small flames rising in a row above a resistor |
| threshold-crossed | Threshold Crossed | bronze | a waveform crossing over a horizontal threshold line into a glowing zone |
| into-the-deep-end | Into the Deep End | bronze | an anchor sinking into deep water made of circuit traces |
| fast-transient | Fast Transient | bronze | a stopwatch with a lightning-bolt second hand |
| recovery-response | Recovery Response | bronze | a phoenix rising from a dip in an oscillating waveform |
| third-times-the-charm | Third Time's the Charm | bronze | a clover with three leaves, each leaf a small circuit board |
| curriculum-cartographer | Curriculum Cartographer | bronze | a compass rose overlaid on a map made of circuit traces |
| quest-accepted | Quest Accepted | bronze | an unrolled scroll with a waveform drawn on it and a wax seal |
| night-shift-engineer | Night Shift Engineer | bronze | a crescent moon above a glowing oscilloscope |
| morning-bode-call | Morning Bode Call | bronze | a sunrise whose rays form a Bode magnitude plot |
| weekend-duty-cycle | Weekend Duty Cycle | bronze | a square wave with two tall weekend pulses highlighted |
| routh-table-complete | Routh Table Complete | bronze | a neat grid/table with a stability checkmark in the corner |
| rising-response | Rising Response | silver | a rising exponential curve climbing an oscilloscope grid |
| century-of-signals | Century of Signals | silver | a laurel wreath encircling a dense burst of radio waves |
| critically-damped | Critically Damped | silver | a perfectly smooth curve settling onto a target line, no overshoot |
| five-day-feedback-loop | Five-Day Feedback Loop | silver | five linked flame icons forming a circular loop |
| regular-oscillator | Regular Oscillator | silver | a metronome whose ticking arm draws a sine wave |
| mastered-the-loop | Mastered the Loop | silver | a closed feedback-loop diagram wearing a small crown |
| pole-placement-pro | Pole Placement Pro | silver | five X-marks (poles) precisely placed on an s-plane grid |
| no-second-guessing | No Second-Guessing | silver | a dart striking dead-center of a target made of a resistor color-code ring |
| underdamped-and-proud | Underdamped and Proud | silver | a lively ringing waveform with a speed-blur trail |
| robust-to-disturbance | Robust to Disturbance | silver | a shield deflecting a jagged noise spike away from a clean signal |
| systems-surveyor | Systems Surveyor | silver | a telescope surveying a constellation of connected topic nodes |
| every-answer-counts | Every Answer Counts | silver | five different puzzle pieces snapping together into a chip |
| seasoned-adventurer | Seasoned Adventurer | silver | a worn map with ten waypoint flags along a circuit-trace path |
| flawless-frequency | Flawless Frequency | silver | a pristine sine wave inside a flawless diamond outline |
| charged-up | Charged Up | silver | a capacitor overflowing with lightning energy |
| overshoot-to-settling | From Overshoot to Settling | silver | a step-response curve overshooting then settling into a glowing band |
| against-the-poles | Against the Poles | silver | a sword planted between X-marks on the s-plane, left of the axis |
| frequency-domain-traveler | Frequency Domain Traveler | silver | a small rocket flying along a Bode plot curve like a road |
| signal-marathon | Signal Marathon | gold | a runner silhouette made of waveform lines crossing a finish ribbon |
| the-500-club | The 500 Club | gold | a grand trophy cup filled with glowing signal waves |
| zero-steady-state-error | Zero Steady-State Error | gold | a waveform locked perfectly flat onto a target line with a padlock |
| pure-precision | Pure Precision | gold | ten arrows all in one bullseye forming a star pattern |
| fortnight-of-feedback | Fortnight of Feedback | gold | a calendar page wreathed in a continuous flame border |
| marginally-unstoppable | Marginally Unstoppable | gold | an infinity symbol made of flame and circuit trace |
| dominant-pole | Dominant Pole | gold | one giant glowing X-mark towering over smaller poles on the s-plane |
| full-state-mastery | Full-State Mastery | gold | a fortress tower built from stacked circuit boards with a victory banner |
| grand-unified-engineer | Grand Unified Engineer | gold | a globe woven entirely from circuit traces, antennas, and waveforms, crowned |
| heavy-duty | Heavy Duty | gold | a heavy barbell whose weights are power resistors |
| edge-of-instability | Edge of Instability | gold | a tightrope walker balancing on the imaginary axis of the s-plane |
| questline-legend | Questline Legend | gold | an ornate banner with fifty tiny stars orbiting a quest scroll |
| double-digits | Double Digits | gold | a level-up chevron stack, ten chevrons tall, glowing at the top |
| closed-loop-perfection | Closed-Loop Perfection | platinum | a radiant crown at the center of a perfect closed feedback loop, surrounded by every motif: waveform, chip, antenna, resistor, laurel |

## Quests (7)

Save each as `public/badges/quests/<slug>.png`. Suggested tier: bronze for daily, silver for weekly.

| slug | cadence | emblem subject |
|---|---|---|
| daily-time-response-5 | daily | five small step-response curves on a sticky note |
| daily-stability-3 | daily | three balanced scales made of s-plane axes |
| daily-review-2 | daily | a magnifying glass revisiting a previously marked waveform |
| daily-hard-1 | daily | a single cracked boulder revealing a glowing chip inside |
| weekly-pass-topic | weekly | a flag planted on a hill shaped like a rising curve |
| weekly-master-topic | weekly | a crowned flag on a mountain peak made of circuit layers |
| weekly-mixed-10 | weekly | ten assorted signal shapes gathered into one satchel |
