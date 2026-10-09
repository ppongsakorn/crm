import Link from "next/link";
import { isBook, type Topic } from "@/lib/data";

export function TopicCard({ topic, tldr, whenYouSay, why }: { topic: Topic; tldr?: string; whenYouSay?: string; why?: string }) {
  return (
    <Link href={`/topics/${topic.slug}`} className={`card g-${topic.group}`}>
      <h3>
        <span className="emoji" aria-hidden="true">
          {topic.emoji}
        </span>{" "}
        {topic.name}
        <small>
          {topic.en}
          {!isBook(topic) && <span className="new-badge">ใหม่ 2026</span>}
        </small>
      </h3>
      {whenYouSay && <div className="when">“{whenYouSay}”</div>}
      <p className="how">{tldr ?? topic.intro}</p>
      {why && <p className="match">ตรงกับ “{why}”</p>}
      <div className="src">
        <span>{topic.prompts.length} prompts · หัวข้อที่ {topic.n}</span>
        <b>เปิดอ่าน →</b>
      </div>
    </Link>
  );
}
