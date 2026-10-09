import { FillablePrompt } from "@/components/FillablePrompt";

/** The topic's 20 prompts, numbered as in the book, each fillable and copyable. */
export function PromptList({ n, prompts }: { n: number; prompts: string[] }) {
  return (
    <ol className="prompts">
      {prompts.map((p, i) => (
        <li key={i}>
          <span className="pn">
            {n}.{i + 1}
          </span>
          <FillablePrompt text={p} />
        </li>
      ))}
    </ol>
  );
}
