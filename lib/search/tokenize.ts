// Thai-aware tokenizer. Thai has no spaces between words, so default
// tokenizers see a whole sentence as one "word"; Intl.Segmenter splits it
// into dictionary words.

const segmenter = new Intl.Segmenter("th", { granularity: "word" });

// Function words that carry no meaning for matching. Negations such as ไม่
// are kept on purpose ("ไม่กล้าพูด" ≠ "กล้าพูด").
const STOPWORDS = new Set([
  "ที่", "และ", "การ", "ของ", "ใน", "เป็น", "ให้", "ได้", "มี", "จะ", "กับ", "แล้ว", "ก็", "ว่า", "คือ",
  "หรือ", "ไป", "มา", "อยู่", "นี้", "นั้น", "ซึ่ง", "โดย", "เพื่อ", "แต่", "ยัง", "ถ้า", "เมื่อ", "จาก",
  "ทำ", "อย่าง", "ๆ", "เรา", "ฉัน", "ผม", "ครับ", "ค่ะ", "คะ", "นะ", "จ้า", "บ้าง", "อะไร", "ยังไง", "อย่างไร",
  "สำหรับ", "เช่น", "the", "a", "an", "of", "to", "and", "or", "in", "for", "on", "is", "how",
]);

export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const s of segmenter.segment(text.toLowerCase())) {
    if (!s.isWordLike) continue;
    const w = s.segment.trim();
    if (w && !STOPWORDS.has(w)) out.push(w);
  }
  return out;
}

/** Latin words get typo tolerance and prefix search; Thai words match exactly (short Thai words are too ambiguous). */
export const isLatin = (term: string) => /^[a-z0-9][a-z0-9-]*$/.test(term);
