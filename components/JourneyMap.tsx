"use client";

import type { Landmark, PathStep } from "@/lib/paths";

/** 24×24 stroke glyphs for the stage landmarks. */
const GLYPH: Record<Landmark, string> = {
  camp: "M3 20 12 5l9 15ZM9 20l3-5 3 5M12 5V3",
  gate: "M4 20V10a8 8 0 0 1 16 0v10M3 20h18M9 20v-5a3 3 0 0 1 6 0v5M4 12h16",
  village: "M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5h4v5",
  signpost: "M12 3v18M8 21h8M12 5h7l2 2.5-2 2.5h-7M12 12H5l-2 2.5L5 17h7",
  tower: "M12 11v10M8 21h8M10 21l2-10 2 10M8.5 6.5a5 5 0 0 1 7 0M5.5 3.5a9 9 0 0 1 13 0M12 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3",
  echo: "M7 9a5 5 0 1 1 8.4 3.7c-1.2 1-1.4 2-1.4 3.3a3 3 0 0 1-5.6 1.5M10 9.5a2 2 0 0 1 4 0M19 7a6 6 0 0 1 0 6M21.5 5a9 9 0 0 1 0 10",
  castle: "M3 21h18M5 21V9h2V6h2v3h2V6h2v3h2V6h2v3h2v12M10 21v-4a2 2 0 0 1 4 0v4",
  summit: "M2 20l7-11 4 6 3-4 6 9ZM12 9V3h5l-1.5 1.5L17 6h-5",
};

export type StageState = "done" | "current" | "ahead";

interface Pt {
  x: number;
  y: number;
}

/** Smooth trail through the waypoints (Catmull-Rom → cubic Bézier), one segment per leg. */
function legs(pts: Pt[]): string[] {
  return pts.slice(0, -1).map((p1, i) => {
    const p0 = pts[i - 1] ?? p1;
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    return `M${p1.x} ${p1.y}C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x} ${p2.y}`;
  });
}

const Tree = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g className="jm-tree" transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0-22 9-6H4l8 10H-12l8-10h-5Z" />
    <path d="M0 4v6" className="jm-trunk" />
  </g>
);

const Hill = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => <path className="jm-hill" d={`M${x - w / 2} ${y}Q${x} ${y - h * 2} ${x + w / 2} ${y}Z`} />;

const Peak = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g className="jm-peak" transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-30 0-8-30 4-14 12-24 34 0Z" />
    <path d="M-8-30-14-22-8-24-2-21Z" className="jm-snow" />
  </g>
);

const Compass = ({ x, y }: { x: number; y: number }) => (
  <g className="jm-compass" transform={`translate(${x} ${y})`} aria-hidden="true">
    <circle r="20" />
    <path d="M0-26 5-5 26 0 5 5 0 26-5 5-26 0-5-5Z" />
    <path d="M0-26 5-5 0 0-5-5Z" className="jm-north" />
    <text y="-30" textAnchor="middle">N</text>
  </g>
);

/**
 * The starter path drawn as an adventure map: a winding trail through eight
 * landmarks. The trail fills in as stages are completed, the current stage is
 * marked "you are here", and each landmark jumps to its stage card.
 */
export function JourneyMap({
  steps,
  state,
  progress,
  onPick,
  mobile = false,
}: {
  steps: Pick<PathStep, "id" | "place" | "icon" | "stage" | "when">[];
  state: (id: string) => StageState;
  progress: (id: string) => number; // 0–1 share of the stage's quests done
  onPick: (id: string) => void;
  mobile?: boolean;
}) {
  const n = steps.length;
  // Desktop: a left-to-right switchback. Phone: a top-to-bottom trail with labels on the right.
  const W = mobile ? 360 : 1000;
  const H = mobile ? 96 + n * 92 : 380;
  const pts: Pt[] = steps.map((_, i) =>
    mobile ? { x: i % 2 ? 122 : 70, y: 72 + i * 92 } : { x: 70 + i * ((W - 140) / (n - 1)), y: i % 2 ? 128 : 262 },
  );
  const paths = legs(pts);
  const label = (i: number) =>
    mobile ? { x: 166, y: pts[i].y - 6, anchor: "start" as const } : { x: pts[i].x, y: i % 2 ? pts[i].y - 52 : pts[i].y + 50, anchor: "middle" as const };
  const end = pts[n - 1];

  return (
    <figure className={`jmap${mobile ? " mobile" : ""}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="แผนที่การเดินทาง CRM ปีแรก">
        <defs>
          <pattern id="jm-grain" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="4" r="0.9" className="jm-dot" />
            <circle cx="14" cy="15" r="0.7" className="jm-dot" />
          </pattern>
        </defs>
        <rect width={W} height={H} rx="18" className="jm-ground" />
        <rect width={W} height={H} rx="18" fill="url(#jm-grain)" />

        {/* scenery */}
        {mobile ? (
          <g aria-hidden="true">
            <Peak x={322} y={42} s={0.7} />
            <Tree x={24} y={pts[1].y + 40} s={0.8} />
            <Tree x={26} y={pts[2].y + 58} s={0.7} />
            <Tree x={22} y={pts[4].y + 46} s={0.8} />
            <Hill x={310} y={H - 14} w={120} h={22} />
            <Tree x={30} y={pts[6].y + 50} s={0.7} />
            <Compass x={318} y={H - 70} />
          </g>
        ) : (
          <g aria-hidden="true">
            <Peak x={300} y={70} s={1.1} />
            <Peak x={345} y={74} s={0.75} />
            <ellipse cx={560} cy={52} rx={60} ry={18} className="jm-lake" />
            <path d="M520 52q10-5 20 0t20 0 20 0" className="jm-wave" />
            <Peak x={800} y={66} s={0.9} />
            <Hill x={190} y={372} w={200} h={26} />
            <Tree x={160} y={352} />
            <Tree x={214} y={358} s={0.8} />
            <Hill x={440} y={372} w={160} h={20} />
            <Tree x={430} y={356} s={0.9} />
            <Tree x={690} y={356} />
            <Tree x={712} y={362} s={0.7} />
            <Tree x={40} y={110} s={0.8} />
            <Tree x={62} y={118} s={0.6} />
            <Compass x={930} y={320} />
          </g>
        )}

        {/* trail: walked legs solid, the rest dashed */}
        {paths.map((d, i) => (
          <path key={`b${i}`} d={d} className="jm-trail-bed" />
        ))}
        {paths.map((d, i) => (
          <path key={`t${i}`} d={d} className={`jm-trail${state(steps[i].id) === "done" ? " walked" : ""}`} />
        ))}

        {/* start and finish */}
        <g aria-hidden="true" className="jm-flag" transform={mobile ? `translate(12 ${pts[0].y - 14})` : `translate(${pts[0].x - 44} ${pts[0].y - 18})`}>
          <path d="M0 0v26M0 0h14l-3 4 3 4H0" />
          <text x="7" y="40" textAnchor="middle">เริ่ม</text>
        </g>
        <g aria-hidden="true" className="jm-finish" transform={mobile ? `translate(${end.x} ${end.y + 46})` : `translate(${end.x} ${end.y - 96})`}>
          <text textAnchor="middle">{mobile ? "ปีที่ 2 ↓" : "ปีที่ 2 →"}</text>
        </g>

        {steps.map((s, i) => {
          const p = pts[i];
          const st = state(s.id);
          const l = label(i);
          const frac = progress(s.id);
          const C = 2 * Math.PI * 27;
          return (
            <a
              key={s.id}
              href={`#step-${s.id}`}
              className={`jm-stop g-${s.stage} ${st}`}
              aria-label={`ด่าน ${i + 1} ${s.place} (${s.when}) — ${st === "done" ? "ผ่านแล้ว" : st === "current" ? "อยู่ด่านนี้" : "ยังไม่ถึง"}`}
              onClick={(e) => {
                e.preventDefault();
                onPick(s.id);
              }}
            >
              {st === "current" && <circle cx={p.x} cy={p.y} r="34" className="jm-halo" />}
              <circle cx={p.x} cy={p.y} r="27" className="jm-ring-bg" />
              {frac > 0 && frac < 1 && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="27"
                  className="jm-ring"
                  strokeDasharray={`${(C * frac).toFixed(1)} ${C.toFixed(1)}`}
                  transform={`rotate(-90 ${p.x} ${p.y})`}
                />
              )}
              <circle cx={p.x} cy={p.y} r="22" className="jm-disc" />
              <path d={GLYPH[s.icon]} transform={`translate(${p.x - 12} ${p.y - 12})`} className="jm-glyph" />
              {st === "done" && (
                <g transform={`translate(${p.x + 17} ${p.y - 17})`} className="jm-check">
                  <circle r="9" />
                  <path d="M-4 0l3 3 5-6" />
                </g>
              )}
              <text x={l.x} y={l.y} textAnchor={l.anchor} className="jm-num">
                ด่าน {i + 1} · {s.when}
              </text>
              <text x={l.x} y={l.y + 20} textAnchor={l.anchor} className="jm-place">
                {s.place}
              </text>
              {st === "current" && (
                <g className="jm-here" transform={mobile ? `translate(${l.x} ${l.y + 30})` : `translate(${p.x + 128 > W ? p.x - 128 : p.x + 36} ${p.y - 12})`}>
                  <rect width="92" height="24" rx="12" />
                  <text x="46" y="16.5" textAnchor="middle">
                    คุณอยู่ที่นี่
                  </text>
                </g>
              )}
            </a>
          );
        })}
      </svg>
      <figcaption>
        <span>
          <i className="lg done" /> ผ่านแล้ว
        </span>
        <span>
          <i className="lg current" /> ด่านปัจจุบัน
        </span>
        <span>
          <i className="lg ahead" /> ยังไม่ถึง
        </span>
        <span className="muted">แตะที่ด่านเพื่อดูภารกิจ</span>
      </figcaption>
    </figure>
  );
}
