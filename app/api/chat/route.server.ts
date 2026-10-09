import Anthropic from "@anthropic-ai/sdk";
import { getClient, fallbackParams, isConfigured, model, effort } from "@/lib/ai";
import { getTopic } from "@/lib/data";
import { ADVISOR_SYSTEM, topicContext } from "@/lib/prompt";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 40;
const MAX_CHARS = 8000;
const LIMIT = Number(process.env.RATE_LIMIT_PER_10MIN) || 30;

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

function parseBody(body: unknown): { messages: ChatTurn[]; slug?: string } | string {
  if (!body || typeof body !== "object") return "invalid body";
  const { messages, slug } = body as { messages?: unknown; slug?: unknown };
  if (!Array.isArray(messages) || messages.length === 0) return "messages required";
  if (messages.length > MAX_MESSAGES) return "conversation too long — start a new chat";
  for (const [i, m] of messages.entries()) {
    if (!m || typeof m !== "object") return "invalid message";
    const { role, content } = m as Record<string, unknown>;
    if (role !== (i % 2 === 0 ? "user" : "assistant")) return "messages must alternate user/assistant";
    if (typeof content !== "string" || !content.trim()) return "empty message";
    if (content.length > MAX_CHARS) return `message longer than ${MAX_CHARS} characters`;
  }
  if (messages.length % 2 === 0) return "last message must be from the user";
  if (slug !== undefined && typeof slug !== "string") return "invalid slug";
  return { messages: messages as ChatTurn[], slug: slug as string | undefined };
}

function json(status: number, error: string, headers?: HeadersInit) {
  return Response.json({ error }, { status, headers });
}

export async function POST(req: Request) {
  if (!isConfigured()) return json(503, "ยังไม่ได้ตั้งค่า API key ของ AI (ดู README หัวข้อ ตัวแปร Environment)");

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rl = rateLimit(ip, LIMIT);
  if (!rl.ok) return json(429, "ใช้งานถี่เกินไป กรุณารอสักครู่", { "Retry-After": String(rl.retryAfterSec) });

  let parsed;
  try {
    parsed = parseBody(await req.json());
  } catch {
    return json(400, "invalid JSON");
  }
  if (typeof parsed === "string") return json(400, parsed);

  const topic = parsed.slug ? getTopic(parsed.slug) : undefined;
  const system: Anthropic.Beta.BetaTextBlockParam[] = [
    { type: "text", text: ADVISOR_SYSTEM, cache_control: { type: "ephemeral" } },
  ];
  if (topic) system.push({ type: "text", text: topicContext(topic) });

  const stream = getClient().beta.messages.stream(
    {
      model,
      max_tokens: 16000,
      system,
      messages: parsed.messages,
      output_config: { effort },
      ...fallbackParams(),
    },
    { signal: req.signal },
  );

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\n_ขออภัย คำถามนี้ไม่สามารถตอบได้ ลองถามในมุมของ CRM และการดูแลลูกค้าดูนะครับ_"));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("\n\n_(คำตอบยาวเกินกำหนด พิมพ์ \"ต่อ\" เพื่อให้ตอบส่วนที่เหลือ)_"));
        }
      } catch (err) {
        if (req.signal.aborted) return;
        console.error("chat stream failed", err);
        const msg =
          err instanceof Anthropic.RateLimitError
            ? "ระบบ AI ถูกใช้งานหนาแน่น กรุณาลองใหม่อีกครั้ง"
            : err instanceof Anthropic.AuthenticationError
              ? "ยังไม่ได้ตั้งค่า API key ของ AI (ดู README)"
              : "เกิดข้อผิดพลาดในการเชื่อมต่อ AI กรุณาลองใหม่";
        controller.enqueue(encoder.encode(`\n\n⚠️ ${msg}`));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
