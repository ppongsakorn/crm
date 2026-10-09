import { FillablePrompt } from "@/components/FillablePrompt";
import type { Knowledge } from "@/lib/data";

/** Longer, structured prompts (role · context · task · format) to build on. */
export function MegaPrompts({ items }: { items: Knowledge["advancedPrompts"] }) {
  return (
    <div className="mega">
      {items.map((p, i) => (
        <article key={i} className="mega-card">
          <header>
            <h3>{p.title}</h3>
            <p className="use-when">ใช้เมื่อ {p.useWhen}</p>
          </header>
          <FillablePrompt text={p.prompt} block />
        </article>
      ))}
    </div>
  );
}
