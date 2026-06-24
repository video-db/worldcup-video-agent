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

/* ── Panel 1 — Ask once ───────────────────────────────────────────────── */
export function PanelAskOnce() {
  return (
    <SketchFrame label="You ask the agent once">
      {/* Key meets socket: the agent gets plugged in. */}
      <rect x="36" y="66" width="76" height="76" rx="14" stroke={INK} strokeWidth="2.5" className="sketch-stroke" />
      <path d="M74 50 L74 66" stroke={INK} strokeWidth="2.4" className="sketch-stroke" />
      <circle cx="74" cy="45" r="5" fill={ORANGE} />
      <circle cx="61" cy="94" r="5" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />
      <circle cx="88" cy="94" r="5" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />
      <path d="M61 116 Q74 124 88 116" stroke={INK} strokeWidth="2.2" className="sketch-stroke" />

      <rect x="126" y="84" width="46" height="34" rx="8" stroke={INK} strokeWidth="2.4" className="sketch-stroke" />
      <path d="M126 96 L112 96" stroke={INK} strokeWidth="2.4" className="sketch-stroke" />
      <path d="M112 88 L112 104" stroke={INK} strokeWidth="2.4" className="sketch-stroke" />
      <path d="M172 96 L186 96" stroke={INK} strokeWidth="2.4" className="sketch-stroke" />
      <path d="M186 88 L186 104" stroke={INK} strokeWidth="2.4" className="sketch-stroke" />

      <g stroke={ORANGE} strokeWidth="2.4" className="sketch-stroke">
        <circle cx="151" cy="53" r="10" />
        <path d="M142 59 L122 75" />
        <path d="M129 69 L136 76" />
        <path d="M122 75 L127 81" />
      </g>
      <path d="M114 78 Q124 73 134 69" stroke={INK} strokeWidth="1.8" strokeDasharray="2 5" className="sketch-stroke" />
      <path d="M119 137 Q144 153 176 136" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />
      <path d="M173 129 L184 135 L174 142" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />
      <text x="111" y="168" textAnchor="middle" className="font-hand" fontSize="18" fill={INK}>keys click in</text>
    </SketchFrame>
  );
}

/* ── Panel 2 — Pick a time + a channel ────────────────────────────────── */
export function PanelPickTime() {
  return (
    <SketchFrame label="Pick a time and an inbox">
      {/* Clear schedule card with one big clock. */}
      <rect x="42" y="44" width="136" height="116" rx="14" stroke={INK} strokeWidth="2.5" className="sketch-stroke" />
      <path d="M42 68 Q76 71 178 67" stroke={INK} strokeWidth="2" className="sketch-stroke" />
      <path d="M66 36 L66 55 M154 36 L154 55" stroke={INK} strokeWidth="2.4" className="sketch-stroke" />
      <circle cx="110" cy="103" r="34" stroke={INK} strokeWidth="2.5" className="sketch-stroke" />
      <circle cx="110" cy="103" r="34" stroke={ORANGE} strokeWidth="2.1" strokeDasharray="3 8" opacity="0.75" className="sketch-stroke" />
      <path d="M110 103 L110 80" stroke={INK} strokeWidth="2.5" className="sketch-stroke" />
      <path d="M110 103 L128 112" stroke={ORANGE} strokeWidth="2.5" className="sketch-stroke" />
      <circle cx="110" cy="103" r="3" fill={INK} />
      <path d="M67 86 L82 86 M67 104 L82 104 M67 122 L82 122" stroke={INK} strokeWidth="1.7" opacity="0.55" className="sketch-stroke" />
      <path d="M140 86 L154 86 M140 104 L154 104 M140 122 L154 122" stroke={INK} strokeWidth="1.7" opacity="0.55" className="sketch-stroke" />
      <text x="110" y="151" textAnchor="middle" className="font-hand" fontSize="18" fill={ORANGE}>daily at 9:00</text>
    </SketchFrame>
  );
}

/* ── Panel 3 — The agent works while you sleep ────────────────────────── */
export function PanelAgentWorks() {
  return (
    <SketchFrame label="The agent works while you are away">
      {/* Robot discovers a clip, cuts it, and sends the finished reel. */}
      <path d="M30 136 Q86 140 190 136" stroke={INK} strokeWidth="2.5" className="sketch-stroke" />

      <g stroke={INK} strokeWidth="2.3" className="sketch-stroke">
        <rect x="35" y="78" width="76" height="32" rx="6" />
        <path d="M43 78 L43 110 M55 78 L55 110 M67 78 L67 110 M79 78 L79 110 M91 78 L91 110 M103 78 L103 110" opacity="0.55" />
        <path d="M44 90 L102 90" opacity="0.45" />
        <path d="M44 99 L102 99" opacity="0.45" />
      </g>
      <circle cx="73" cy="94" r="13" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />
      <path d="M83 104 L96 117" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />

      <rect x="112" y="55" width="58" height="48" rx="10" stroke={INK} strokeWidth="2.5" className="sketch-stroke" />
      <path d="M141 43 L141 55" stroke={INK} strokeWidth="2.2" className="sketch-stroke" />
      <circle cx="141" cy="39" r="4.5" fill={ORANGE} />
      <circle cx="130" cy="77" r="5" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />
      <circle cx="153" cy="77" r="5" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />
      <path d="M129 91 Q141 96 154 91" stroke={INK} strokeWidth="2.1" className="sketch-stroke" />
      <path d="M112 84 Q101 91 94 104" stroke={INK} strokeWidth="2.2" className="sketch-stroke" />
      <path d="M170 85 Q182 90 187 104" stroke={INK} strokeWidth="2.2" className="sketch-stroke" />

      <g stroke={ORANGE} strokeWidth="2.1" className="sketch-stroke">
        <path d="M104 118 L117 106" />
        <path d="M104 106 L117 118" />
        <circle cx="101" cy="104" r="4" />
        <circle cx="101" cy="120" r="4" />
      </g>

      <rect x="147" y="111" width="38" height="48" rx="8" stroke={INK} strokeWidth="2.3" className="sketch-stroke" />
      <path d="M155 127 L176 139 L155 151 Z" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />
      <path d="M191 122 Q198 129 196 138 M140 122 Q133 129 135 138" stroke={ORANGE} strokeWidth="2" className="sketch-stroke" />
      <text x="94" y="162" textAnchor="middle" className="font-hand" fontSize="17" fill={INK}>find + cut</text>
      <text x="167" y="176" textAnchor="middle" className="font-hand" fontSize="16" fill={ORANGE}>delivered</text>
    </SketchFrame>
  );
}

/* ── Panel 4 — Delivered to you ───────────────────────────────────────── */
export function PanelDelivered() {
  return (
    <SketchFrame label="The reel is delivered to you">
      {/* Final reel lands on a buzzing phone after the robot cuts it. */}
      <rect x="36" y="80" width="50" height="42" rx="8" stroke={INK} strokeWidth="2.4" className="sketch-stroke" />
      <path d="M61 67 L61 80" stroke={INK} strokeWidth="2.2" className="sketch-stroke" />
      <circle cx="61" cy="63" r="4" fill={ORANGE} />
      <circle cx="51" cy="99" r="4" stroke={ORANGE} strokeWidth="2" className="sketch-stroke" />
      <circle cx="71" cy="99" r="4" stroke={ORANGE} strokeWidth="2" className="sketch-stroke" />
      <path d="M50 111 Q61 116 72 111" stroke={INK} strokeWidth="2" className="sketch-stroke" />

      <g stroke={INK} strokeWidth="2" className="sketch-stroke">
        <rect x="44" y="135" width="62" height="22" rx="5" />
        <path d="M52 135 L52 157 M64 135 L64 157 M76 135 L76 157 M88 135 L88 157 M100 135 L100 157" opacity="0.55" />
      </g>
      <path d="M102 122 L112 134 M112 122 L102 134" stroke={ORANGE} strokeWidth="2.1" className="sketch-stroke" />

      <path d="M92 88 Q112 73 134 72" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />
      <path d="M130 63 L143 72 L130 80" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />

      <g className="deliver-buzz" style={{ transformBox: "fill-box" } as React.CSSProperties}>
        <rect x="132" y="46" width="52" height="92" rx="11" stroke={INK} strokeWidth="2.5" className="sketch-stroke" />
        <path d="M140 58 L176 58 M140 126 L176 126" stroke={INK} strokeWidth="1.6" opacity="0.7" className="sketch-stroke" />
        <rect x="142" y="72" width="32" height="28" rx="5" stroke={ORANGE} strokeWidth="2.1" className="sketch-stroke" />
        <path d="M154 79 L166 86 L154 93 Z" fill={ORANGE} />
        <path d="M143 110 Q157 114 175 109" stroke={INK} strokeWidth="1.8" opacity="0.6" className="sketch-stroke" />
      </g>
      <path d="M190 62 q8 8 6 18 M190 116 q8 -8 6 -18 M126 62 q-8 8 -6 18 M126 116 q-8 -8 -6 -18" stroke={ORANGE} strokeWidth="2" className="sketch-stroke" />
      <text x="111" y="174" textAnchor="middle" className="font-hand" fontSize="17" fill={INK}>clip lands</text>
    </SketchFrame>
  );
}

/* ── STEPPER PANELS (Phase 5 – videodb-deck style) ────────────────────── */
/*
   Visual language: stick-figure cartoons, speech bubbles, wobbly hand-drawn
   strokes, #F24E1E orange for focal points. One clear narrative per panel.
   Toolkit references (from videodb-deck): stick, bubble, gear, arrow, box, frame.
*/

/* Panel 1 — Plug in your keys to wake the agent */
export function PanelConnectKeys() {
  return (
    <SketchFrame label="Connect your TinyFish and VideoDB API keys">
      <rect x="38" y="70" width="72" height="70" rx="14" stroke={INK} strokeWidth="2.5" className="sketch-stroke" />
      <path d="M74 54 L74 70" stroke={INK} strokeWidth="2.4" className="sketch-stroke" />
      <circle cx="74" cy="49" r="5" fill={ORANGE} />
      <circle cx="62" cy="96" r="5" stroke={ORANGE} strokeWidth="2.1" className="sketch-stroke" />
      <circle cx="87" cy="96" r="5" stroke={ORANGE} strokeWidth="2.1" className="sketch-stroke" />
      <path d="M62 118 Q74 126 88 118" stroke={INK} strokeWidth="2.1" className="sketch-stroke" />

      <rect x="126" y="86" width="48" height="34" rx="8" stroke={INK} strokeWidth="2.4" className="sketch-stroke" />
      <path d="M126 98 L111 98 M111 90 L111 106 M174 98 L189 98 M189 90 L189 106" stroke={INK} strokeWidth="2.4" className="sketch-stroke" />
      <circle cx="151" cy="55" r="10" stroke={ORANGE} strokeWidth="2.4" className="sketch-stroke" />
      <path d="M142 61 L120 78 M128 72 L136 80 M120 78 L126 84" stroke={ORANGE} strokeWidth="2.4" className="sketch-stroke" />
      <path d="M117 80 Q126 75 136 71" stroke={INK} strokeWidth="1.8" strokeDasharray="2 5" className="sketch-stroke" />
      <path d="M119 139 Q144 154 177 138" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />
      <path d="M174 131 L184 137 L174 144" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />
      <text x="111" y="169" textAnchor="middle" className="font-hand" fontSize="18" fill={INK}>keys connected</text>
    </SketchFrame>
  );
}

/* Panel 2 — Connect a Telegram or Discord inbox */
export function PanelAddInbox() {
  return (
    <SketchFrame label="Add your Telegram or Discord inbox">
      <rect x="52" y="42" width="82" height="58" rx="14" stroke={INK} strokeWidth="2.5" className="sketch-stroke" />
      <path d="M74 100 L62 118 L88 102" stroke={INK} strokeWidth="2.4" className="sketch-stroke" />
      <path d="M69 62 L117 62 M69 79 L103 79" stroke={INK} strokeWidth="2" opacity="0.55" className="sketch-stroke" />
      <circle cx="134" cy="41" r="11" fill={ORANGE} />
      <text x="134" y="47" textAnchor="middle" className="font-hand" fontSize="17" fill={INK}>1</text>

      <path d="M93 126 Q122 109 154 96" stroke={ORANGE} strokeWidth="2.2" strokeDasharray="3 6" className="sketch-stroke" />
      <path d="M134 87 L169 78 L147 112 L143 96 Z" stroke={ORANGE} strokeWidth="2.4" className="sketch-stroke" />

      <rect x="145" y="96" width="42" height="66" rx="9" stroke={INK} strokeWidth="2.5" className="sketch-stroke" />
      <path d="M153 111 L177 111 M153 126 L171 126 M153 141 L176 141" stroke={INK} strokeWidth="1.7" opacity="0.6" className="sketch-stroke" />
      <path d="M189 109 q8 6 7 15 M141 109 q-8 6 -7 15" stroke={ORANGE} strokeWidth="2" className="sketch-stroke" />
      <text x="94" y="162" textAnchor="middle" className="font-hand" fontSize="18" fill={INK}>reels land here</text>
    </SketchFrame>
  );
}

/* Panel 3 — Agent runs on schedule, reel arrives while you sleep */
export function PanelSetSchedule() {
  return (
    <SketchFrame label="Set it once — delivered every day">
      <rect x="42" y="44" width="136" height="116" rx="14" stroke={INK} strokeWidth="2.5" className="sketch-stroke" />
      <path d="M42 68 Q82 71 178 67" stroke={INK} strokeWidth="2" className="sketch-stroke" />
      <path d="M66 36 L66 55 M154 36 L154 55" stroke={INK} strokeWidth="2.4" className="sketch-stroke" />
      <circle cx="110" cy="103" r="34" stroke={INK} strokeWidth="2.5" className="sketch-stroke" />
      <circle cx="110" cy="103" r="34" stroke={ORANGE} strokeWidth="2.1" strokeDasharray="3 8" opacity="0.75" className="sketch-stroke" />
      <path d="M110 103 L110 80" stroke={INK} strokeWidth="2.5" className="sketch-stroke" />
      <path d="M110 103 L128 112" stroke={ORANGE} strokeWidth="2.5" className="sketch-stroke" />
      <circle cx="110" cy="103" r="3" fill={INK} />
      <path d="M67 86 L82 86 M67 104 L82 104 M67 122 L82 122" stroke={INK} strokeWidth="1.7" opacity="0.55" className="sketch-stroke" />
      <path d="M140 86 L154 86 M140 104 L154 104 M140 122 L154 122" stroke={INK} strokeWidth="1.7" opacity="0.55" className="sketch-stroke" />
      <text x="110" y="151" textAnchor="middle" className="font-hand" fontSize="18" fill={ORANGE}>daily at 9:00</text>
    </SketchFrame>
  );
}

/* ── A circular "set once → runs every day → delivered" loop badge ─────── */
export function DeliveryLoopIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 260" className={className} role="img" aria-label="Set it once, delivered every day" fill="none">
      {/* circular loop: set once -> every day -> delivered */}
      <path d="M130 34 Q194 36 222 91 Q248 146 207 197 Q164 245 97 225 Q35 207 28 137 Q21 72 75 45 Q98 34 130 34" stroke={INK} strokeWidth="2.3" strokeDasharray="3 9" opacity="0.55" className="sketch-stroke" />
      <path d="M216 82 L230 91 L216 101" stroke={ORANGE} strokeWidth="2.8" className="sketch-stroke" />
      <path d="M44 181 L30 171 L47 164" stroke={ORANGE} strokeWidth="2.8" className="sketch-stroke" />

      <g className="float-bob">
        <rect x="91" y="79" width="78" height="72" rx="11" stroke={INK} strokeWidth="2.6" className="sketch-stroke" />
        <path d="M91 101 Q119 104 169 101" stroke={INK} strokeWidth="2.2" className="sketch-stroke" />
        <path d="M108 69 L108 88 M152 69 L152 88" stroke={INK} strokeWidth="2.6" className="sketch-stroke" />
        <circle cx="113" cy="121" r="4.5" fill={ORANGE} />
        <circle cx="130" cy="121" r="3.8" fill={INK} opacity="0.35" />
        <circle cx="147" cy="121" r="3.8" fill={INK} opacity="0.35" />
        <circle cx="113" cy="137" r="3.8" fill={INK} opacity="0.35" />
        <circle cx="130" cy="137" r="3.8" fill={INK} opacity="0.35" />
      </g>

      <g stroke={INK} strokeWidth="2.3" className="sketch-stroke">
        <circle cx="66" cy="67" r="14" />
        <path d="M54 76 L34 91" />
        <path d="M43 84 L51 93" />
        <path d="M34 91 L40 99" />
      </g>

      <g className="deliver-buzz" style={{ transformBox: "fill-box" } as React.CSSProperties}>
        <rect x="183" y="165" width="42" height="58" rx="9" stroke={INK} strokeWidth="2.4" className="sketch-stroke" />
        <path d="M194 184 L215 196 L194 208 Z" stroke={ORANGE} strokeWidth="2" className="sketch-stroke" />
      </g>
      <path d="M230 178 q8 8 5 18 M178 178 q-8 8 -5 18" stroke={ORANGE} strokeWidth="2.2" className="sketch-stroke" />

      <text x="130" y="181" textAnchor="middle" className="font-hand" fontSize="22" fill={INK}>every day</text>
      <text x="130" y="204" textAnchor="middle" className="font-hand" fontSize="19" fill={ORANGE}>set once → delivered</text>
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
