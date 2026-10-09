import { groups } from "@/lib/data";

/** The nine-colour ring logo: eight lifecycle stages around a "data & systems" core. */
export function JourneyMark({ size = 28 }: { size?: number }) {
  const ring = groups.filter((g) => g.id !== "data");
  const n = ring.length;
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      {ring.map((g, i) => {
        const a0 = ((i * (360 / n) - 90) * Math.PI) / 180;
        const a1 = (((i + 1) * (360 / n) - 90) * Math.PI) / 180;
        const p = (a: number, r: number) => `${(14 + r * Math.cos(a)).toFixed(2)} ${(14 + r * Math.sin(a)).toFixed(2)}`;
        return <path key={g.id} d={`M${p(a0, 13)} A13 13 0 0 1 ${p(a1, 13)} L${p(a1, 8)} A8 8 0 0 0 ${p(a0, 8)} Z`} fill={`var(--${g.id})`} />;
      })}
      <circle cx="14" cy="14" r="5" fill="var(--data)" />
    </svg>
  );
}
