/* Hand-drawn, PhD-Comics-style illustrations that explain the "set it once,
   the agent delivers reels to your channel on a schedule" concept.

   Everything is inline SVG drawn with currentColor ink so a single panel works
   on either a light ("paper") or dark surface — set the ink via a text color
   class on the wrapper. Accents use the brand orange (#F24E1E). The deliberate
   wobble in the strokes is what gives it the hand-sketched feel. */

import React, { ReactNode } from "react";

const INK = "currentColor";
const ORANGE = "#F24E1E";

/* A wobbly hand-drawn panel frame. */
function SketchFrame({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <svg viewBox="0 0 220 200" className="h-auto w-full" role="img" aria-label={label} fill="none">
      <path
        d="M10 14 Q12 9 18 8 L196 6 Q205 7 206 14 L208 184 Q207 192 199 193 L20 195 Q11 194 10 186 Z"
        stroke={INK}
        strokeWidth="2.4"
        className="sketch-stroke"
        opacity="0.9"
      />
      {children}
    </svg>
  );
}

/* Stick figure helper — head + body + arms, positioned by translate. */
function StickFigure({ x, y, arm = "up", accent = false }: { x: number; y: number; arm?: "up" | "down" | "cheer"; accent?: boolean }) {
  const stroke = accent ? ORANGE : INK;
  return (
    <g transform={`translate(${x} ${y})`} stroke={stroke} strokeWidth="2.4" className="sketch-stroke">
      <circle cx="0" cy="0" r="9" />
      <path d="M0 9 Q-1 22 0 34" />
      {arm === "up" && <path d="M0 16 Q10 12 16 4" />}
      {arm === "up" && <path d="M0 16 Q-8 18 -13 22" />}
      {arm === "cheer" && <path d="M0 15 Q9 8 12 -2" />}
      {arm === "cheer" && <path d="M0 15 Q-9 8 -12 -2" />}
      {arm === "down" && <path d="M0 16 Q9 22 13 28" />}
      {arm === "down" && <path d="M0 16 Q-9 22 -13 28" />}
      <path d="M0 34 Q-7 42 -11 49" />
      <path d="M0 34 Q7 42 11 49" />
    </g>
  );
}

/* ── Panel 1 — Ask once ───────────────────────────────────────────────── */
export function PanelAskOnce() {
  return (
    <SketchFrame label="You ask the agent once">
      <StickFigure x={48} y={92} arm="up" />
      {/* speech bubble */}
      <path d="M86 36 Q84 26 96 24 L182 22 Q196 22 196 34 L196 64 Q196 75 184 75 L108 77 L96 92 L100 76 Q86 74 86 62 Z" stroke={INK} strokeWidth="2.2" className="sketch-stroke" />
      <text x="142" y="46" textAnchor="middle" className="font-hand" fontSize="16" fill={INK}>“Every goal from</text>
      <text x="142" y="63" textAnchor="middle" className="font-hand" fontSize="16" fill={INK}>Brazil vs Morocco”</text>
      {/* football */}
      <circle cx="48" cy="158" r="11" stroke={ORANGE} strokeWidth="2.4" />
      <path d="M48 149 l4 6 -3 7 -5 0 -3 -7 z" stroke={ORANGE} strokeWidth="1.6" className="sketch-stroke" />
    </SketchFrame>
  );
}

/* ── Panel 2 — Pick a time + a channel ────────────────────────────────── */
export function PanelPickTime() {
  return (
    <SketchFrame label="Pick a time and an inbox">
      {/* clock */}
      <circle cx="70" cy="78" r="34" stroke={INK} strokeWidth="2.4" />
      <circle cx="70" cy="78" r="34" stroke={ORANGE} strokeWidth="2.4" strokeDasharray="3 7" opacity="0.7" />
      <path d="M70 78 L70 56" stroke={INK} strokeWidth="2.6" className="sketch-stroke" />
      <path d="M70 78 L88 86" stroke={ORANGE} strokeWidth="2.6" className="sketch-stroke" />
      <circle cx="70" cy="78" r="2.5" fill={INK} />
      <text x="70" y="132" textAnchor="middle" className="font-hand" fontSize="17" fill={ORANGE}>9:00 AM, daily</text>
      {/* phone / channel */}
      <rect x="150" y="48" width="44" height="74" rx="8" stroke={INK} strokeWidth="2.4" />
      <path d="M150 60 L194 60" stroke={INK} strokeWidth="1.6" />
      <path d="M150 110 L194 110" stroke={INK} strokeWidth="1.6" />
      {/* paper plane (Telegram-ish) */}
      <path d="M159 74 L185 70 L168 96 L165 84 Z" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />
      <text x="172" y="138" textAnchor="middle" className="font-hand" fontSize="15" fill={INK}>your inbox</text>
    </SketchFrame>
  );
}

/* ── Panel 3 — The agent works while you sleep ────────────────────────── */
export function PanelAgentWorks() {
  return (
    <SketchFrame label="The agent works while you are away">
      {/* moon */}
      <path d="M44 30 a16 16 0 1 0 14 24 a13 13 0 0 1 -14 -24 z" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />
      <text x="78" y="34" className="font-hand" fontSize="15" fill={INK}>zzz…</text>
      {/* desk */}
      <path d="M30 150 L196 150" stroke={INK} strokeWidth="2.6" />
      {/* robot agent */}
      <rect x="92" y="78" width="56" height="48" rx="9" stroke={INK} strokeWidth="2.4" />
      <path d="M120 66 L120 78" stroke={INK} strokeWidth="2.2" />
      <circle cx="120" cy="62" r="4" fill={ORANGE} />
      <circle cx="108" cy="100" r="5" stroke={ORANGE} strokeWidth="2.2" />
      <circle cx="132" cy="100" r="5" stroke={ORANGE} strokeWidth="2.2" />
      <path d="M106 114 Q120 120 134 114" stroke={INK} strokeWidth="2.2" className="sketch-stroke" />
      {/* film strip being cut */}
      <rect x="40" y="96" width="44" height="20" rx="3" stroke={INK} strokeWidth="2" />
      <path d="M46 96 L46 116 M54 96 L54 116 M62 96 L62 116 M70 96 L70 116 M78 96 L78 116" stroke={INK} strokeWidth="1.2" opacity="0.6" />
      <text x="113" y="174" textAnchor="middle" className="font-hand" fontSize="15" fill={INK}>finds · cuts · captions</text>
    </SketchFrame>
  );
}

/* ── Panel 4 — Delivered to you ───────────────────────────────────────── */
export function PanelDelivered() {
  return (
    <SketchFrame label="The reel is delivered to you">
      {/* phone buzzing */}
      <g className="deliver-buzz" style={{ transformBox: "fill-box" } as React.CSSProperties}>
        <rect x="78" y="40" width="64" height="100" rx="11" stroke={INK} strokeWidth="2.4" />
        <rect x="86" y="56" width="48" height="34" rx="4" stroke={ORANGE} strokeWidth="2.2" />
        {/* play triangle */}
        <path d="M104 66 L116 73 L104 80 Z" fill={ORANGE} />
        <path d="M88 102 L132 102 M88 112 L120 112" stroke={INK} strokeWidth="1.8" opacity="0.6" />
      </g>
      {/* buzz lines */}
      <path d="M150 52 q8 4 8 12 M150 128 q8 -4 8 -12" stroke={ORANGE} strokeWidth="2" className="sketch-stroke" />
      <path d="M62 52 q-8 4 -8 12 M62 128 q-8 -4 -8 -12" stroke={ORANGE} strokeWidth="2" className="sketch-stroke" />
      <StickFigure x={40} y={150} arm="cheer" accent />
      <text x="150" y="174" textAnchor="middle" className="font-hand" fontSize="16" fill={INK}>ready to watch ✦</text>
    </SketchFrame>
  );
}

/* ── A circular "set once → runs every day → delivered" loop badge ─────── */
export function DeliveryLoopIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 260" className={className} role="img" aria-label="Set it once, delivered every day" fill="none">
      {/* dashed orbit with arrowheads */}
      <circle cx="130" cy="130" r="96" stroke={ORANGE} strokeWidth="2.6" strokeDasharray="2 10" opacity="0.8" />
      <path d="M226 124 l8 8 -10 6" stroke={ORANGE} strokeWidth="2.6" className="sketch-stroke" />
      <path d="M34 136 l-8 -8 10 -6" stroke={ORANGE} strokeWidth="2.6" className="sketch-stroke" />
      {/* center: calendar */}
      <rect x="92" y="92" width="76" height="72" rx="10" stroke={INK} strokeWidth="2.6" />
      <path d="M92 110 L168 110" stroke={INK} strokeWidth="2.2" />
      <path d="M108 84 L108 100 M152 84 L152 100" stroke={INK} strokeWidth="2.6" className="sketch-stroke" />
      <circle cx="112" cy="128" r="4" fill={ORANGE} />
      <circle cx="130" cy="128" r="4" fill={INK} opacity="0.4" />
      <circle cx="148" cy="128" r="4" fill={INK} opacity="0.4" />
      <circle cx="112" cy="146" r="4" fill={INK} opacity="0.4" />
      <circle cx="130" cy="146" r="4" fill={INK} opacity="0.4" />
      <text x="130" y="186" textAnchor="middle" className="font-hand" fontSize="20" fill={INK}>every day</text>
      {/* little satellites */}
      <g className="float-bob">
        <path d="M36 60 L58 56 L44 78 L42 67 Z" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />
      </g>
      <rect x="196" y="186" width="34" height="24" rx="5" stroke={INK} strokeWidth="2.2" />
      <path d="M201 196 L221 192 L209 208 Z" stroke={ORANGE} strokeWidth="1.8" className="sketch-stroke" />
    </svg>
  );
}

/* ── A compact, surface-agnostic step strip (ink follows currentColor) ──
   Used on dark surfaces (e.g. the /schedules empty state) where the white
   sketch reads like chalk on a blackboard. */
type Step = { Panel: () => React.JSX.Element; title: string; desc: string };
export function SchedulerStepStrip({ steps }: { steps: Step[] }) {
  return (
    <div className="mt-9 grid w-full grid-cols-1 gap-x-5 gap-y-8 text-center sm:grid-cols-2 lg:grid-cols-4">
      {steps.map(({ Panel, title, desc }, i) => (
        <div key={title} className="flex flex-col items-center">
          <div className="relative w-full max-w-[200px] text-[var(--c-text)]">
            <span className="absolute -left-1 -top-2 z-10 inline-flex size-7 items-center justify-center rounded-full bg-[#F24E1E] font-mono text-[12px] font-semibold text-white">
              {i + 1}
            </span>
            <Panel />
          </div>
          <h3 className="mt-3 text-[14px] font-medium text-[var(--c-text)]">{title}</h3>
          <p className="mt-1 max-w-[220px] text-[12.5px] leading-relaxed text-[var(--c-text-subtle)]">{desc}</p>
        </div>
      ))}
    </div>
  );
}

/* ── The full landing-page story section (light "paper" band) ─────────── */
const STEPS = [
  { n: 1, Panel: PanelAskOnce, title: "Tell it once", body: "Describe the moments you care about — “every penalty”, “all the fouls”, “Messi goals”. Plain words, no setup." },
  { n: 2, Panel: PanelPickTime, title: "Pick a time & inbox", body: "Choose when it should run and where it lands: your Telegram chat or Discord server." },
  { n: 3, Panel: PanelAgentWorks, title: "It works while you’re away", body: "Each day the agent finds the match, watches every frame, cuts the reel and writes the recap — on its own." },
  { n: 4, Panel: PanelDelivered, title: "Delivered to you", body: "A ready-to-watch reel lands in your inbox. No app to open, no refresh — it just shows up." },
];

export function SchedulerStory() {
  return (
    <section className="ds-section--light text-[#111111]">
      <div className="mx-auto w-full max-w-[1080px] px-[22px] py-16 sm:py-20">
        <div className="ds-section-heading ds-section-heading--light ds-section-heading--centered">
          <span className="ds-eyebrow ds-eyebrow--orange">The game-changer</span>
          <h2 className="ds-section-heading__title">
            Your agent doesn’t wait for you.<br />It delivers.
          </h2>
          <p className="ds-section-heading__lead">
            Most tools make you come back and press the button. Here you set it up{" "}
            <span className="font-semibold text-[#111111]">once</span> — then a reel of exactly
            the moments you asked for arrives in your chat, every single day.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ n, Panel, title, body }) => (
            <div key={n} className="flex flex-col items-center text-center">
              <div className="relative w-full max-w-[220px] text-[#1a1a1a]">
                <span className="absolute -left-1 -top-2 z-10 inline-flex size-7 items-center justify-center rounded-full bg-[#F24E1E] font-mono text-[12px] font-semibold text-white">
                  {n}
                </span>
                <Panel />
              </div>
              <h3 className="mt-4 text-[17px] font-medium tracking-[-0.01em] text-[#111111]">{title}</h3>
              <p className="mt-1.5 max-w-[260px] text-[13.5px] leading-relaxed text-[rgba(0,0,0,0.6)]">{body}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-[560px] text-center font-hand text-[22px] leading-snug text-[#F24E1E]">
          Set it Friday night. Wake up Saturday to the weekend’s goals already cut and waiting.
        </p>
      </div>
    </section>
  );
}
