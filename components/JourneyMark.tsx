import { groups } from "@/lib/data";

/**
 * The site mark: eight lifecycle stages as separate arcs around a "customer on
 * a data base" core. Colours come from the stage variables, so it follows the
 * light/dark theme. app/icon.svg is the same drawing as a standalone file.
 */
const R = 25;
const GAP = 5; // degrees between arcs
const point = (deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return `${(32 + R * Math.cos(a)).toFixed(2)} ${(32 + R * Math.sin(a)).toFixed(2)}`;
};

export function JourneyMark({ size = 28 }: { size?: number }) {
  const ring = groups.filter((g) => g.id !== "data");
  const seg = 360 / ring.length;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {ring.map((g, i) => (
        <path
          key={g.id}
          d={`M${point(i * seg + GAP / 2)}A${R} ${R} 0 0 1 ${point((i + 1) * seg - GAP / 2)}`}
          fill="none"
          stroke={`var(--${g.id})`}
          strokeWidth="10"
        />
      ))}
      <circle cx="32" cy="32" r="14" fill="var(--data)" />
      <g fill="var(--bg)">
        <circle cx="32" cy="26.5" r="4.3" />
        <path d="M23.5 41.2A8.5 8.5 0 0 1 40.5 41.2Z" />
      </g>
    </svg>
  );
}
