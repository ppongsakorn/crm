import { CopyButton } from "@/components/CopyButton";
import { PromptText } from "@/components/PromptText";
import type { Knowledge } from "@/lib/data";

/** Longer, structured prompts (role · context · task · format) to build on. */
export function MegaPrompts({ items }: { items: Knowledge["advancedPrompts"] }) {
  return (
    <div className="mega">
      {items.map((p, i) => (
        <article key={i} className="mega-card">
          <header>
            <div>
              <h3>{p.title}</h3>
              <p className="use-when">ใช้เมื่อ {p.useWhen}</p>
            </div>
            <CopyButton text={p.prompt} />
          </header>
          <pre>
            <PromptText text={p.prompt} />
          </pre>
        </article>
      ))}
    </div>
  );
}
