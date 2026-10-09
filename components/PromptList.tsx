import { CopyButton } from "@/components/CopyButton";
import { PromptText } from "@/components/PromptText";

/** The topic's 20 prompts from the book, numbered as in the book, each with a copy button. */
export function PromptList({ n, prompts }: { n: number; prompts: string[] }) {
  return (
    <ol className="prompts">
      {prompts.map((p, i) => (
        <li key={i}>
          <span className="pn">
            {n}.{i + 1}
          </span>
          <span className="pt">
            <PromptText text={p} />
          </span>
          <CopyButton text={p} />
        </li>
      ))}
    </ol>
  );
}
