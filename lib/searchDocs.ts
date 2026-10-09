import { getKnowledge, topics, unquote, type Topic } from "@/lib/data";
import type { SearchDoc } from "@/lib/search/types";

/** The text the search engines index for one topic: book content + knowledge layer, plain text only. */
export function searchDoc(t: Topic): SearchDoc {
  const k = getKnowledge(t.slug);
  return {
    slug: t.slug,
    name: t.name,
    en: t.en,
    when: k ? unquote(k.whenYouSay) : "",
    tldr: k?.tldr ?? t.intro,
    concepts: k ? k.concepts.map((c) => `${c.term} ${c.desc}`).join(" ") : "",
    faq: k ? k.faq.map((f) => f.q).join(" ") : "",
    prompts: t.prompts.join(" "),
  };
}

export const searchDocs: SearchDoc[] = topics.map(searchDoc);
