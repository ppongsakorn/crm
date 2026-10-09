"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FillablePrompt } from "@/components/FillablePrompt";
import type { Knowledge } from "@/lib/data";

/** Question-and-answer accordion. Each answer ends with a follow-up prompt to take to an AI. */
export function Faq({ items }: { items: Knowledge["faq"] }) {
  return (
    <div className="faq">
      {items.map((f, i) => (
        <details key={i} className="qa" open={i === 0}>
          <summary>
            <span className="qn">Q{i + 1}</span>
            <span>{f.q}</span>
          </summary>
          <div className="qa-body">
            <div className="answer">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{f.a}</ReactMarkdown>
            </div>
            <div className="followup">
              <div className="followup-head">
                <b>Prompt ต่อยอด</b>
              </div>
              <FillablePrompt text={f.prompt} block />
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
